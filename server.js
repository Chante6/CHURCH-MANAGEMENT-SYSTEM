
const db = require('./db');
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Protect API routes
app.use('/api', (req, res, next) => {
    const publicRoutes = [
        '/login',
        '/session',
        '/logout'
    ];

    if (publicRoutes.includes(req.path)) {
        return next();
    }

    if (!req.session.user) {
        return res.status(401).json({
            message: 'Please log in first'
        });
    }

    next();
});



app.use((req, res, next) => {
    const isLoginPage = req.path === '/login.html';
    const isWebsitePage =
        req.path === '/' || req.path.endsWith('.html');

    if (isWebsitePage && !isLoginPage && !req.session.user) {
        return res.redirect('/login.html');
    }

    next();
});

app.use(express.static(__dirname));

// HOME PAGE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// TEST DATABASE
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS database_name'
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Database connection failed');
    }
});

// =====================================
// MEMBERS
// =====================================

// Get all members
app.get('/api/members', async (req, res) => {
    try {
        const [members] = await db.query(
            'SELECT * FROM members ORDER BY member_id'
        );
        res.json(members);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to retrieve members' });
    }
});

// Add member
app.post('/api/members', async (req, res) => {
    try {
        const {
            first_name, last_name, gender,
            phone, email, date_joined
        } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({
                message: 'First name and last name are required'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO members
            (first_name, last_name, gender, phone, email, date_joined)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, gender || null,
                phone || null, email || null, date_joined || null
            ]
        );

        res.status(201).json({
            message: 'Member added successfully',
            member_id: result.insertId
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to add member' });
    }
});

// Update member
app.put('/api/members/:id', async (req, res) => {
    try {
        const {
            first_name, last_name, gender,
            phone, email, date_joined
        } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({
                message: 'First name and last name are required'
            });
        }

        const [result] = await db.execute(
            `UPDATE members
             SET first_name = ?, last_name = ?, gender = ?,
                 phone = ?, email = ?, date_joined = ?
             WHERE member_id = ?`,
            [
                first_name, last_name, gender || null,
                phone || null, email || null, date_joined || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to update member' });
    }
});

// Delete member
app.delete('/api/members/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM members WHERE member_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to delete member' });
    }
});

// =====================================
// DEPARTMENTS
// =====================================

// Get departments
app.get('/api/departments', async (req, res) => {
    try {
        const [departments] = await db.query(
            'SELECT * FROM departments ORDER BY department_id'
        );
        res.json(departments);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to retrieve departments' });
    }
});

// Add department
app.post('/api/departments', async (req, res) => {
    try {
        const { department_name, description } = req.body;

        if (!department_name || !department_name.trim()) {
            return res.status(400).json({
                message: 'Department name is required'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO departments (department_name, description)
             VALUES (?, ?)`,
            [department_name.trim(), description || null]
        );

        res.status(201).json({
            message: 'Department added successfully',
            department_id: result.insertId
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to add department' });
    }
});

// Update department
app.put('/api/departments/:id', async (req, res) => {
    try {
        const { department_name, description } = req.body;

        if (!department_name || !department_name.trim()) {
            return res.status(400).json({
                message: 'Department name is required'
            });
        }

        const [result] = await db.execute(
            `UPDATE departments
             SET department_name = ?, description = ?
             WHERE department_id = ?`,
            [department_name.trim(), description || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Department not found'
            });
        }

        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Failed to update department' });
    }
});

// Delete department
app.delete('/api/departments/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM departments WHERE department_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Department not found'
            });
        }

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Could not delete department. It may be linked to members.'
        });
    }
});

// =====================================
// MEMBER-DEPARTMENT ASSIGNMENTS
// =====================================

// Get assignments
app.get('/api/assignments', async (req, res) => {
    try {
        const [assignments] = await db.query(`
            SELECT
                md.member_id,
                md.department_id,
                m.first_name,
                m.last_name,
                d.department_name
            FROM member_departments md
            JOIN members m ON md.member_id = m.member_id
            JOIN departments d ON md.department_id = d.department_id
            ORDER BY d.department_name, m.first_name
        `);

        res.json(assignments);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to retrieve assignments'
        });
    }
});

// Assign member to department
app.post('/api/assignments', async (req, res) => {
    try {
        const { member_id, department_id } = req.body;

        if (!member_id || !department_id) {
            return res.status(400).json({
                message: 'Please select a member and a department'
            });
        }

        await db.execute(
            `INSERT INTO member_departments
             (member_id, department_id)
             VALUES (?, ?)`,
            [member_id, department_id]
        );

        res.status(201).json({
            message: 'Member assigned successfully'
        });
    } catch (error) {
        console.error(error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'This member is already assigned to this department'
            });
        }

        res.status(500).json({
            message: 'Failed to assign member. Check that the member and department exist.'
        });
    }
});

// Remove assignment
app.delete('/api/assignments/:memberId/:departmentId', async (req, res) => {
    try {
        const { memberId, departmentId } = req.params;

        const [result] = await db.execute(
            `DELETE FROM member_departments
             WHERE member_id = ? AND department_id = ?`,
            [memberId, departmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.json({
            message: 'Member removed from department successfully'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to remove assignment'
        });
    }
});

// =====================================
// CONTRIBUTIONS
// =====================================

// Get contributions
app.get('/api/contributions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.contribution_id,
                c.member_id,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name,
                c.amount,
                DATE_FORMAT(c.contribution_date, '%Y-%m-%d') AS contribution_date
            FROM contributions c
            JOIN members m ON c.member_id = m.member_id
            ORDER BY c.contribution_date DESC, c.contribution_id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to load contributions'
        });
    }
});

// Add contribution
app.post('/api/contributions', async (req, res) => {
    try {
        const { member_id, amount, contribution_date } = req.body;
        const numericAmount = Number(amount);

        if (!member_id || !Number.isFinite(numericAmount) ||
            numericAmount <= 0 || !contribution_date) {
            return res.status(400).json({
                message: 'Select a member and enter a valid amount and date'
            });
        }

        await db.execute(
            `INSERT INTO contributions
             (member_id, amount, contribution_date)
             VALUES (?, ?, ?)`,
            [member_id, numericAmount, contribution_date]
        );

        res.status(201).json({
            message: 'Contribution recorded successfully'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to record contribution'
        });
    }
});

// Update contribution
app.put('/api/contributions/:id', async (req, res) => {
    try {
        const { member_id, amount, contribution_date } = req.body;
        const numericAmount = Number(amount);

        if (!member_id || !Number.isFinite(numericAmount) ||
            numericAmount <= 0 || !contribution_date) {
            return res.status(400).json({
                message: 'Enter valid contribution details'
            });
        }

        const [result] = await db.execute(
            `UPDATE contributions
             SET member_id = ?, amount = ?, contribution_date = ?
             WHERE contribution_id = ?`,
            [member_id, numericAmount, contribution_date, req.params.id]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.execute(
                'SELECT contribution_id FROM contributions WHERE contribution_id = ?',
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Contribution not found'
                });
            }
        }

        res.json({ message: 'Contribution updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to update contribution'
        });
    }
});

// Delete contribution
app.delete('/api/contributions/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM contributions WHERE contribution_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Contribution not found'
            });
        }

        res.json({ message: 'Contribution deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to delete contribution'
        });
    }
});

// =====================================
// EXPENSES
// =====================================

// Get expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                expense_id,
                expense_name,
                amount,
                DATE_FORMAT(expense_date, '%Y-%m-%d') AS expense_date
            FROM expenses
            ORDER BY expense_date DESC, expense_id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to load expenses'
        });
    }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
    try {
        const { expense_name, amount, expense_date } = req.body;
        const numericAmount = Number(amount);

        if (!expense_name || !expense_name.trim() ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0 || !expense_date) {
            return res.status(400).json({
                message: 'Enter an expense name, valid amount and date'
            });
        }

        await db.execute(
            `INSERT INTO expenses
             (expense_name, amount, expense_date)
             VALUES (?, ?, ?)`,
            [expense_name.trim(), numericAmount, expense_date]
        );

        res.status(201).json({
            message: 'Expense recorded successfully'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to record expense'
        });
    }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
    try {
        const { expense_name, amount, expense_date } = req.body;
        const numericAmount = Number(amount);

        if (!expense_name || !expense_name.trim() ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0 || !expense_date) {
            return res.status(400).json({
                message: 'Enter valid expense details'
            });
        }

        const [result] = await db.execute(
            `UPDATE expenses
             SET expense_name = ?, amount = ?, expense_date = ?
             WHERE expense_id = ?`,
            [expense_name.trim(), numericAmount, expense_date, req.params.id]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.execute(
                'SELECT expense_id FROM expenses WHERE expense_id = ?',
                [req.params.id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Expense not found'
                });
            }
        }

        res.json({ message: 'Expense updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to update expense'
        });
    }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM expenses WHERE expense_id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Expense not found'
            });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            message: 'Failed to delete expense'
        });
    }
});

 // =====================================
 // EVENTS MANAGEMENT
 // =====================================

 // Get all events
 app.get('/api/events', async (req, res) => {
     try {
         const [events] = await db.query(`
             SELECT
                 event_id,
                 event_name,
                 DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
                 location,
                 description
             FROM events
             ORDER BY event_date DESC
         `);

         res.json(events);
     } catch (error) {
         console.error('Error fetching events:', error.message);
         res.status(500).json({ message: 'Failed to retrieve events' });
     }
 });

 // Add event
 app.post('/api/events', async (req, res) => {
     try {
         const { event_name, event_date, location, description } = req.body;

         if (!event_name || !event_name.trim() || !event_date) {
             return res.status(400).json({
                 message: 'Event name and date are required'
             });
         }

         const [result] = await db.execute(
             `INSERT INTO events
              (event_name, event_date, location, description)
              VALUES (?, ?, ?, ?)`,
             [
                 event_name.trim(),
                 event_date,
                 location || null,
                 description || null
             ]
         );

         res.status(201).json({
             message: 'Event added successfully',
             event_id: result.insertId
         });
     } catch (error) {
         console.error('Error adding event:', error.message);
         res.status(500).json({ message: 'Failed to add event' });
     }
 });

 // Update event
 app.put('/api/events/:id', async (req, res) => {
     try {
         const { event_name, event_date, location, description } = req.body;

         if (!event_name || !event_name.trim() || !event_date) {
             return res.status(400).json({
                 message: 'Event name and date are required'
             });
         }

         const [result] = await db.execute(
             `UPDATE events
              SET event_name = ?, event_date = ?,
                  location = ?, description = ?
              WHERE event_id = ?`,
             [
                 event_name.trim(),
                 event_date,
                 location || null,
                 description || null,
                 req.params.id
             ]
         );

         if (result.affectedRows === 0) {
             const [existing] = await db.execute(
                 'SELECT event_id FROM events WHERE event_id = ?',
                 [req.params.id]
             );

             if (existing.length === 0) {
                 return res.status(404).json({ message: 'Event not found' });
             }
         }

         res.json({ message: 'Event updated successfully' });
     } catch (error) {
         console.error('Error updating event:', error.message);
         res.status(500).json({ message: 'Failed to update event' });
     }
 });

 // Delete event
 app.delete('/api/events/:id', async (req, res) => {
     try {
         const [result] = await db.execute(
             'DELETE FROM events WHERE event_id = ?',
             [req.params.id]
         );

         if (result.affectedRows === 0) {
             return res.status(404).json({ message: 'Event not found' });
         }

         res.json({ message: 'Event deleted successfully' });
     } catch (error) {
         console.error('Error deleting event:', error.message);
         res.status(500).json({ message: 'Failed to delete event' });
     }
 });

// =====================================
// DASHBOARD
// =====================================

app.get('/api/dashboard', async (req, res) => {
    try {
        const [members] = await db.query(
            'SELECT COUNT(*) AS total FROM members'
        );

        const [departments] = await db.query(
            'SELECT COUNT(*) AS total FROM departments'
        );

        const [contributions] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS total FROM contributions'
        );

        const [expenses] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses'
        );

        const [upcomingEvents] = await db.query(`
            SELECT
                event_id,
                event_name,
                DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
                location
            FROM events
            WHERE event_date >= CURDATE()
            ORDER BY event_date ASC
            LIMIT 5
        `);

        res.json({
            totalMembers: members[0].total,
            totalDepartments: departments[0].total,
            totalContributions: contributions[0].total,
            totalExpenses: expenses[0].total,
            balance: Number(contributions[0].total) -
                     Number(expenses[0].total),
            upcomingEvents
        });

    } catch (error) {
        console.error('Dashboard error:', error.message);
        res.status(500).json({
            message: 'Failed to load dashboard information'
        });
    }
});
// =====================================
// LOGIN SYSTEM
// =====================================

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        req.session.user = {
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };

        res.json({
            message: 'Login successful',
            user: req.session.user
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            message: 'Login failed'
        });
    }
});

// Check logged-in user
app.get('/api/session', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Not logged in'
        });
    }

    res.json(req.session.user);
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: 'Logout failed'
            });
        }

        res.clearCookie('connect.sid');

        res.json({
            message: 'Logged out successfully'
        });
    });
});


// =====================================
// START SERVER
// =====================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
