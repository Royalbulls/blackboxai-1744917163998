// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuButton?.contains(e.target) && !mobileMenu?.contains(e.target)) {
            mobileMenu?.classList.add('hidden');
        }
    });

    // Initialize wallet if on a page with coin balance
    initializeWallet();
});

// BBC Coins Wallet System
class BBCWallet {
    constructor() {
        this.balance = parseInt(localStorage.getItem('bbcCoins')) || 0;
        this.transactions = JSON.parse(localStorage.getItem('bbcTransactions')) || [];
        this.updateUI();
    }

    addCoins(amount, reason) {
        this.balance += amount;
        this.addTransaction('CREDIT', amount, reason);
        this.updateStorage();
        this.updateUI();
        showMessage(`Earned ${amount} BBC Coins: ${reason}`, 'success');
    }

    spendCoins(amount, reason) {
        if (this.balance >= amount) {
            this.balance -= amount;
            this.addTransaction('DEBIT', amount, reason);
            this.updateStorage();
            this.updateUI();
            showMessage(`Spent ${amount} BBC Coins: ${reason}`, 'success');
            return true;
        }
        showMessage('Insufficient BBC Coins', 'error');
        return false;
    }

    addTransaction(type, amount, reason) {
        const transaction = {
            id: Date.now(),
            type,
            amount,
            reason,
            timestamp: new Date().toISOString()
        };
        this.transactions.unshift(transaction);
        // Keep only last 10 transactions
        if (this.transactions.length > 10) {
            this.transactions.pop();
        }
    }

    updateStorage() {
        localStorage.setItem('bbcCoins', this.balance.toString());
        localStorage.setItem('bbcTransactions', JSON.stringify(this.transactions));
    }

    updateUI() {
        // Update coin balance display
        document.querySelectorAll('[id^="coinBalance"]').forEach(element => {
            element.textContent = this.balance;
            element.classList.add('coin-balance-update');
            setTimeout(() => element.classList.remove('coin-balance-update'), 500);
        });

        // Update transaction history if element exists
        const historyContainer = document.getElementById('coin-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.transactions.map(t => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}">
                            ${t.type === 'CREDIT' ? '+' : '-'}${t.amount} Coins
                        </p>
                        <p class="text-sm text-gray-600">${t.reason}</p>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${new Date(t.timestamp).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
        }
    }
}

// Initialize wallet
function initializeWallet() {
    window.bbcWallet = new BBCWallet();
}

// Show success/error messages
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50 animate-fadeIn`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    showMessage('An error occurred. Please try again.', 'error');
    return false;
};

// Handle social links form submission
document.addEventListener('DOMContentLoaded', function() {
    const socialLinksForm = document.getElementById('social-links-form');
    if (socialLinksForm) {
        socialLinksForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const socialLinks = {
                telegram: document.getElementById('telegram').value,
                instagram: document.getElementById('instagram').value,
                youtube: document.getElementById('youtube').value
            };
            localStorage.setItem('socialLinks', JSON.stringify(socialLinks));
            showMessage('Social links updated successfully!', 'success');
            updateQRCode(socialLinks);
        });

        // Load saved social links
        const savedLinks = JSON.parse(localStorage.getItem('socialLinks') || '{}');
        Object.keys(savedLinks).forEach(platform => {
            const input = document.getElementById(platform);
            if (input) input.value = savedLinks[platform];
        });
    }
});

// QR Code generation
function updateQRCode(socialLinks) {
    const qrContainer = document.getElementById('qr-code');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        const linksData = JSON.stringify(socialLinks);
        QRCode.toCanvas(qrContainer, linksData, {
            width: 200,
            height: 200,
            color: {
                dark: '#1A3A8C',
                light: '#ffffff'
            }
        }, function(error) {
            if (error) {
                console.error(error);
                showMessage('Failed to generate QR code', 'error');
            }
        });
    }
}

// Download QR Code
function downloadQRCode() {
    const canvas = document.querySelector('#qr-code canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'bbc-social-qr.png';
        link.href = canvas.toDataURL();
        link.click();
        showMessage('QR Code downloaded successfully!', 'success');
    }
}

// Download ID Card
function downloadIDCard() {
    const idCard = document.querySelector('.id-card');
    if (idCard) {
        html2canvas(idCard).then(canvas => {
            const link = document.createElement('a');
            link.download = 'bbc-id-card.png';
            link.href = canvas.toDataURL();
            link.click();
            showMessage('ID Card downloaded successfully!', 'success');
        }).catch(error => {
            console.error('Error generating ID card:', error);
            showMessage('Failed to download ID card', 'error');
        });
    }
}
