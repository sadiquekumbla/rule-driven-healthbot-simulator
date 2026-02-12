import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    id: String,
    role: { type: String, enum: ['user', 'model'], required: true },
    text: String,
    timestamp: Date,
    type: String, // 'text', 'image', 'audio', etc.
    metadata: mongoose.Schema.Types.Mixed
}, { _id: false });

const ClientSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // PhoneNumber or ClientId
    name: String,
    messages: [MessageSchema],
    context: {
        age: Number,
        height: Number,
        weight: Number,
        bmi: Number,
        bmiCategory: String,
        medicalConditions: String,
        suggestedCourse: String,
        priceQuote: String,
        stage: { type: String, default: 'GREETING' }
    },
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now }
}, {
    timestamps: true // adds createdAt, updatedAt
});

// Avoid OverwriteModelError if model exists
export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
