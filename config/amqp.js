var amqp = require('amqplib'),
    files = require('../app/models/files');

module.exports = function(app, config) {
  console.log("Connecting to rabbitmq");

  amqp.connect('amqp://'+config.amqp.host).then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });
    return conn.createChannel().then(function(ch) {
      console.log("AMQP channel created");
      app.set('amqp_connection', ch);

      // assert queues
      var ok = ch.assertQueue(config.amqp.api_queue, {durable: true});
      ok = ok.then(function() { ch.assertQueue(config.amqp.worker_queue, {durable: true}); });

      ok = ok.then(function() { ch.prefetch(1); });
      ok = ok.then(function() {
        ch.consume(config.amqp.api_queue, function(msg) {
          console.log("Message received", msg.content);
          var message = msg.content;
          if (message.action == "split") {
            files.updateChunks(app.get('io'), message.id, message.chunks, message.error);
          } else if (message.action == "transcoded") {
            files.updateChunk(app.get('io'), message.id, message.chunk, message.done, message.error);
            files.checkIntegrity(ch, message.id);
          } else if (message.action == "merged") {
            files.done(ch, message.id, message.error);
          }
          ch.ack(message);
        }, {noAck: false});
      });
      return ok;
    });
  }).then(null, console.warn);
};
