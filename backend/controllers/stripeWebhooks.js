import stripe from 'stripe';
import Booking from '../models/booking.js';
import connectDB from '../configs/db.js'; // ⭐ Add this import

export const stripeWebhooks = async(req, res) => {
    // ⭐ Ensure DB is connected before processing webhook
    await connectDB();
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch(error) {
        console.error('⚠️ Webhook signature verification failed:', error.message);
        return res.status(400).send(`Webhook error: ${error.message}`);
    }
    
    try {
        console.log('📥 Received Stripe Event:', event.type);
        console.log('📦 Event ID:', event.id);
        
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                console.log('💳 Session Data:', session);
                console.log('📋 Metadata:', session.metadata);
                
                const { bookingId } = session.metadata;

                if (!bookingId) {
                    console.error('❌ No bookingId in metadata!');
                    break;
                }

                console.log('🎫 Updating booking:', bookingId);

                const updatedBooking = await Booking.findByIdAndUpdate(
                    bookingId,
                    {
                        isPaid: true,
                        paymentLink: ""
                    },
                    { new: true }
                );

                if (updatedBooking) {
                    console.log('✅ Booking updated successfully!');
                    console.log('Updated booking:', updatedBooking);
                } else {
                    console.error('❌ Booking not found with ID:', bookingId);
                }
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                console.log('💰 Payment intent succeeded:', paymentIntent.id);
                break;
            }
        
            default:
                console.log('ℹ️ Unhandled event type:', event.type);
        }
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error("❌ Webhook processing error:", error);
        console.error("Stack:", error.stack);
        res.status(500).json({ error: "Webhook processing failed" });
    }
}