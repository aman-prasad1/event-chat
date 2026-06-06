import 'dotenv/config';
import app from './app.js';


const startServer = async () => {
    try {
        app.listen(process.env.PORT, () => {
            console.log(`Auth service is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
};

startServer();