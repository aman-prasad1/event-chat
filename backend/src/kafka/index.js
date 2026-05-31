import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'event-chat',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
    retry: {
        initialRetryTime: 300,
        retries: 10
    }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'messaging-group' });

const connectKafka = async () => {
    await producer.connect();
    await consumer.connect();
    console.log('Kafka producer and consumer connected');
};


export {
    producer as kafkaProducer,
    consumer as kafkaConsumer,
    connectKafka
}