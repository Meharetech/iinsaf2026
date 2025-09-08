require('dotenv').config();
const Razorpay = require('razorpay');
const paymentHistory = require('../../models/paymentHistory/paymentHistory')
const User = require('../../models/userModel/userModel')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Generate a random receipt ID (for better uniqueness)
const generateReceiptId = () => {
    return 'receipt_' + Math.floor(Math.random() * 1000000);
};

const adsPayment = async (req, res) => {
    const { amount, currency } = req.body;
    if (!amount || !currency) {
        return res.status(400).json({ error: "Amount and currency are required" });
    }

    const options = {
        amount,
        currency,
        receipt: generateReceiptId(),
        payment_capture: 1 // automatic capture after success
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({
            order_id: order.id,
            currency: order.currency,
            amount: order.amount
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Internal server error during order creation" });
    }
};

const successOrNot = async (req, res) => {
    const { paymentId } = req.params;
    // console.log("payment id payment with id success or not",paymentId)
    const userId = req.user._id;
    // console.log("this the user id",userId);


    if (!paymentId) {
        return res.status(400).json({ error: "Payment ID is required" });
    }

    try {
        const payment = await razorpay.payments.fetch(paymentId);

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Only save successful payments
        if (payment.status === "captured") {
            const newHistory = new paymentHistory({
                user: userId,
                paymentId: paymentId,
                amount: payment.amount / 100, // Razorpay returns in paise
                currency: payment.currency,
                method: payment.method,
                status: payment.status,
                totalCost: payment.amount / 100,
                gst: (payment.amount / 100) * 0.18 // if 18% GST
            });

            await newHistory.save();
        }

        res.status(200).json({
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
            currency: payment.currency
        });
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ error: "Failed to fetch payment status" });
    }
};



module.exports = { adsPayment, successOrNot };
