// Razorpay Integration
class RazorpayPayment {
    constructor() {
        // Initialize Razorpay (Replace with your actual key in production)
        this.key = 'rzp_test_1DP5mmOlF5G5ag';
        this.currency = 'INR';
        this.name = 'Brain Bounty Club';
        this.description = 'Course/Membership Payment';
        this.image = 'https://your-logo-url.png'; // Replace with actual logo URL
        this.theme = {
            color: '#1A3A8C'
        };
    }

    // Initialize Razorpay instance
    async initializeRazorpay() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
                showMessage('Failed to load payment gateway', 'error');
            };
            document.body.appendChild(script);
        });
    }

    // Create order
    async createOrder(amount, orderId) {
        try {
            // In a real application, this would make an API call to your backend
            // to create an order and get the order_id
            return {
                amount: amount * 100, // Razorpay expects amount in paise
                currency: this.currency,
                receipt: `receipt_${Date.now()}`,
                order_id: orderId || `order_${Date.now()}`
            };
        } catch (error) {
            console.error('Error creating order:', error);
            showMessage('Failed to create order', 'error');
            throw error;
        }
    }

    // Handle payment
    async handlePayment(amount, options = {}) {
        try {
            const res = await this.initializeRazorpay();
            if (!res) {
                showMessage('Razorpay SDK failed to load', 'error');
                return false;
            }

            const order = await this.createOrder(amount);
            const paymentOptions = {
                key: this.key,
                amount: order.amount,
                currency: this.currency,
                name: this.name,
                description: options.description || this.description,
                image: this.image,
                order_id: order.order_id,
                handler: (response) => {
                    this.handlePaymentSuccess(response);
                },
                prefill: {
                    name: options.name || '',
                    email: options.email || '',
                    contact: options.contact || ''
                },
                notes: {
                    ...options.notes
                },
                theme: this.theme
            };

            const razorpayInstance = new Razorpay(paymentOptions);
            razorpayInstance.open();

        } catch (error) {
            console.error('Payment failed:', error);
            showMessage('Payment failed. Please try again.', 'error');
        }
    }

    // Handle successful payment
    async handlePaymentSuccess(response) {
        try {
            // In a real application, verify the payment signature with your backend
            console.log('Payment successful:', response);
            
            // Add BBC coins based on payment amount
            const coinsToAdd = this.calculateCoins(response.amount / 100); // Convert paise to rupees
            if (window.bbcWallet) {
                window.bbcWallet.addCoins(coinsToAdd, 'Payment bonus');
            }

            // Show success message
            showMessage('Payment successful! BBC Coins added to your wallet.', 'success');
            
            // Redirect to success page
            setTimeout(() => {
                window.location.href = '/pages/payments/success.html';
            }, 2000);

        } catch (error) {
            console.error('Error processing payment success:', error);
            showMessage('Error processing payment. Please contact support.', 'error');
        }
    }

    // Calculate coins based on payment amount
    calculateCoins(amount) {
        // Example conversion rate: ₹1 = 10 BBC Coins
        return Math.floor(amount * 10);
    }

    // Get available plans
    getPlans() {
        return [
            {
                id: 'basic',
                name: 'Basic Membership',
                price: 499,
                coins: 5000,
                features: [
                    'Access to basic quizzes',
                    '5000 BBC Coins',
                    'Digital ID Card',
                    'Basic course access'
                ]
            },
            {
                id: 'pro',
                name: 'Pro Membership',
                price: 999,
                coins: 12000,
                features: [
                    'Access to all quizzes',
                    '12000 BBC Coins',
                    'Premium Digital ID Card',
                    'Full course library access',
                    'Priority support'
                ]
            },
            {
                id: 'premium',
                name: 'Premium Membership',
                price: 1999,
                coins: 25000,
                features: [
                    'Everything in Pro',
                    '25000 BBC Coins',
                    'Exclusive Digital ID Card',
                    'One-on-one mentoring',
                    'Career guidance sessions'
                ]
            }
        ];
    }
}

// Initialize payment handler
let paymentHandler;

// Function to show message
function showMessage(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a more sophisticated message display here
    alert(message);
}

// Make startPayment globally accessible
window.startPayment = async function(planId) {
    console.log('startPayment called with planId:', planId);
    
    try {
        if (!paymentHandler) {
            console.log('Creating new payment handler...');
            paymentHandler = new RazorpayPayment();
            const initResult = await paymentHandler.initializeRazorpay();
            console.log('Razorpay initialization result:', initResult);
        }

        const plans = paymentHandler.getPlans();
        console.log('Available plans:', plans);
        
        const selectedPlan = plans.find(plan => plan.id === planId);
        console.log('Selected plan:', selectedPlan);
        
        if (!selectedPlan) {
            console.error('No plan found for ID:', planId);
            showMessage('Invalid plan selected', 'error');
            return;
        }

        console.log('Starting payment flow for plan:', selectedPlan.name);
        showLoading(true);

        const paymentResult = await paymentHandler.handlePayment(selectedPlan.price, {
            description: `${selectedPlan.name} - Brain Bounty Club`,
            notes: {
                planId: selectedPlan.id,
                coins: selectedPlan.coins
            }
        });
        
        console.log('Payment result:', paymentResult);
        
    } catch (error) {
        console.error('Payment error details:', error);
        showMessage('Failed to initiate payment: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        showLoading(false);
    }
}

// Initialize Razorpay immediately
(async function() {
    console.log('Initializing Razorpay...');
    try {
        paymentHandler = new RazorpayPayment();
        const initResult = await paymentHandler.initializeRazorpay();
        console.log('Razorpay initialization result:', initResult);
        window.razorpayReady = true;
        console.log('Razorpay is ready for payments');
    } catch (error) {
        console.error('Failed to initialize Razorpay:', error);
        window.razorpayReady = false;
        showMessage('Failed to initialize payment system', 'error');
    }
})();

// Show loading state
function showLoading(show = true) {
    const loadingElement = document.getElementById('payment-loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

// Format currency for display
function formatPrice(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}
