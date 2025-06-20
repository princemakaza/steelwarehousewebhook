# Steel Warehouse WhatsApp Bot Webhooks

A WhatsApp business solution for steel warehouse operations, handling customer interactions via Twilio's WhatsApp API with AI-powered responses using OpenAI and Pinecone.

## Technologies Used
- **Node.js** (Runtime environment)
- **Express** (Web server framework)
- **Mongoose** (MongoDB ODM)
- **Twilio** (Phone Number OTP Verification)
- **OpenAI** (AI response generation)
- **Pinecone** (Vector database for embeddings)
- **MongoDB Atlas** (Cloud database service)

## Installation & Setup

### 1. Install dependencies
    npm install

2. Create environment file
Create .env in the root directory with these variables (replace values with your own credentials):


    DATABASE_URL=mongodb+srv://<username>:<password>@cluster.example.mongodb.net/?retryWrites=true&w=majority
    PORT=8080
    OPENAI_API_KEY=your_openai_api_key
    PINECONE_API_KEY=your_pinecone_api_key
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_VERIFY_SERVICE_ID=your_twilio_service_id



3. Start the server
    npm start

Server will run on the port specified in .env (default: http://localhost:8080)

Configuration Requirements
MongoDB Atlas:

Create free-tier cluster

Get connection string for DATABASE_URL

Twilio:

Create OTP Verification account

Obtain Account SID, Auth Token, and Verify Service ID

OpenAI:

Generate API key from platform.openai.com

Pinecone:

Create vector database index

Retrieve API key and environment details

Key Features
OTP Verification with Twilio
AI-driven conversational responses

Vector similarity search for product matching

MongoDB data persistence

Environment-based configuration

Dependencies
See package.json for complete list, including:

express: HTTP server framework

mongoose: MongoDB object modeling

twilio: OTP Verification on Phone Number

openai: AI service integration

@pinecone-database/pinecone: Vector database operations for searching data so that we reduce our prompt to be smaller enough to increase chatgp.

dotenv: Environment variable management

