// investor.js - Complete Investor Module
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

module.exports = (pool) => {
    // Create database views if they don't exist
    const createInvestorViews = async () => {
        try {
            await pool.query(`
                CREATE OR REPLACE VIEW investor_summary AS
                SELECT 
                    (SELECT COALESCE(SUM(total_price), 0) FROM sales) AS total_revenue,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses,
                    (SELECT COALESCE(SUM(total_price), 0) FROM sales) - 
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS net_profit,
                    (SELECT COUNT(*) FROM products WHERE quantity > 0) AS active_products,
                    (SELECT COUNT(*) FROM sales) AS total_transactions,
                    (SELECT SUM(quantity * cost_price) FROM products) AS inventory_value;
            `);
            
            await pool.query(`
                CREATE OR REPLACE VIEW investor_monthly_performance AS
                SELECT 
                    DATE_FORMAT(sale_date, '%Y-%m') AS month,
                    SUM(total_price) AS revenue,
                    (SELECT COALESCE(SUM(amount), 0) 
                     FROM expenses 
                     WHERE DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(sales.sale_date, '%Y-%m')) AS expenses,
                    SUM(total_price) - (SELECT COALESCE(SUM(amount), 0) 
                                       FROM expenses 
                                       WHERE DATE_FORMAT(expense_date, '%Y-%m') = DATE_FORMAT(sales.sale_date, '%Y-%m')) AS net_profit
                FROM sales
                GROUP BY month
                ORDER BY month DESC;
            `);
            
            await pool.query(`
                CREATE OR REPLACE VIEW investor_top_products AS
                SELECT 
                    p.id,
                    p.name,
                    SUM(s.quantity) AS units_sold,
                    SUM(s.total_price) AS revenue,
                    SUM(s.quantity * p.cost_price) AS cost,
                    SUM(s.total_price) - SUM(s.quantity * p.cost_price) AS profit,
                    p.quantity AS current_stock
                FROM products p
                JOIN sales s ON p.id = s.product_id
                GROUP BY p.id
                ORDER BY profit DESC
                LIMIT 10;
            `);
            
            console.log('Investor database views created/updated');
        } catch (err) {
            console.error('Error creating investor views:', err);
        }
    };

    // Initialize views when module loads
    createInvestorViews();

    // Investor rate limiter
    const investorLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: { 
            success: false,
            error: "Too many requests, please try again later" 
        }
    });

    // Investor role verification middleware
    const verifyInvestorRole = async (req, res, next) => {
        try {
            if (req.user.role !== 'investor') {
                return res.status(403).json({ 
                    success: false,
                    message: "Access denied. Investor role required.",
                    requiredRole: "investor",
                    yourRole: req.user.role
                });
            }
            
            // Verify account is active
            const [user] = await pool.query(
                'SELECT status FROM users WHERE id = ?',
                [req.user.id]
            );
            
            if (!user || user.length === 0 || user[0].status !== 'active') {
                return res.status(403).json({ 
                    success: false,
                    message: "Account not active" 
                });
            }

            next();
        } catch (err) {
            console.error('Investor verification error:', err);
            res.status(500).json({ 
                success: false,
                message: "Internal server error during verification" 
            });
        }
    };

    // Apply security middleware to all investor routes
    router.use((req, res, next) => {
        // Security headers
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
            'X-Frame-Options': 'DENY',
            'Content-Security-Policy': "default-src 'self'"
        });
        next();
    });

    // Apply rate limiting to all investor routes
    router.use(investorLimiter);

    // Validate query parameters for investor routes
    router.use((req, res, next) => {
        if (req.method === 'GET') {
            const { months, limit } = req.query;
            
            if (months && (isNaN(months) || months < 1 || months > 36)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Months must be between 1 and 36" 
                });
            }
            
            if (limit && (isNaN(limit) || limit < 1 || limit > 50)) {
                return res.status(400).json({ 
                    success: false,
                    error: "Limit must be between 1 and 50" 
                });
            }
        }
        
        next();
    });

    /**
     * @route GET /investor/dashboard
     * @description Get investor dashboard summary
     * @access Investor
     */
    router.get('/dashboard', verifyInvestorRole, async (req, res) => {
        try {
            const [summary] = await pool.query('SELECT * FROM investor_summary');
            
            res.json({
                success: true,
                data: summary[0],
                lastUpdated: new Date().toISOString()
            });
        } catch (err) {
            console.error('Investor dashboard error:', err);
            res.status(500).json({ 
                success: false,
                error: "Failed to fetch investor dashboard",
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    /**
     * @route GET /investor/performance
     * @description Get monthly performance data
     * @access Investor
     */
    router.get('/performance', verifyInvestorRole, async (req, res) => {
        try {
            const { months = 12 } = req.query;
            const [performance] = await pool.query(
                'SELECT * FROM investor_monthly_performance LIMIT ?',
                [parseInt(months)]
            );

            res.json({
                success: true,
                data: performance,
                count: performance.length
            });
        } catch (err) {
            console.error('Investor performance error:', err);
            res.status(500).json({ 
                success: false,
                error: "Failed to fetch performance data",
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    /**
     * @route GET /investor/products
     * @description Get top performing products
     * @access Investor
     */
    router.get('/products', verifyInvestorRole, async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const [products] = await pool.query(
                'SELECT * FROM investor_top_products LIMIT ?',
                [parseInt(limit)]
            );

            res.json({
                success: true,
                data: products,
                count: products.length
            });
        } catch (err) {
            console.error('Product performance error:', err);
            res.status(500).json({ 
                success: false,
                error: "Failed to fetch product data",
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    /**
     * @route GET /investor/health
     * @description Get financial health indicators
     * @access Investor
     */
    router.get('/health', verifyInvestorRole, async (req, res) => {
        try {
            const [metrics] = await pool.query(`
                SELECT
                    (SELECT net_profit FROM investor_summary) / 
                    NULLIF((SELECT total_revenue FROM investor_summary), 0) AS profit_margin,
                    
                    (SELECT inventory_value FROM investor_summary) / 
                    NULLIF((SELECT total_revenue FROM investor_summary), 0) AS inventory_turnover,
                    
                    (SELECT total_expenses FROM investor_summary) / 
                    NULLIF((SELECT total_revenue FROM investor_summary), 0) AS expense_ratio,
                    
                    (SELECT COUNT(*) FROM products WHERE quantity < 10) AS low_stock_items,
                    
                    (SELECT COUNT(*) FROM products WHERE quantity = 0) AS out_of_stock_items
            `);
            
            const healthStatus = metrics[0].profit_margin > 0.2 ? "Excellent" :
                                metrics[0].profit_margin > 0.1 ? "Good" : "Needs Improvement";

            res.json({
                success: true,
                data: {
                    ...metrics[0],
                    healthStatus,
                    updatedAt: new Date().toISOString()
                }
            });
        } catch (err) {
            console.error('Financial health error:', err);
            res.status(500).json({ 
                success: false,
                error: "Failed to calculate financial health",
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    });

    return router;
};