const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require("path")

const app = express();

const users = [
    { username: "adminHR", password: "pass", department: "HR", role: "Admin", clearance: 3, seniority: 5 },
    { username: "managerHR", password: "pass", department: "HR", role: "Manager", clearance: 2, seniority: 8 },
    { username: "staffFinance", password: "pass", department: "Finance", role: "Staff", clearance: 1, seniority: 3 },
    { username: "managerFinance", password: "pass", department: "Finance", role: "Manager", clearance: 2, seniority: 7 },
    { username: "directorLegal", password: "pass", department: "Legal", role: "Director", clearance: 3, seniority: 10 },
    { username: "staffIT", password: "pass", department: "IT", role: "Staff", clearance: 1, seniority: 2 },
    { username: "staffOps", password: "pass", department: "Operations", role: "Staff", clearance: 1, seniority: 1 },
];

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}

function authorizeRBAC(roles) {
    return (req, res, next) => {
        if (roles.includes(req.session.user.role)) {
            return next();
        } else {
            res.status(403).send("Forbidden");
        }
    }
}

function authorizeABAC(condition) {
    return (req, res, next) => {
        if (condition(req.session.user)) {
            return next();
        } else {
            res.status(403).send("Forbidden");
        }
    }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "my-secret",
    resave: false,
    saveUninitialized: true,
}));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        req.session.user = user;
        // kita bisa tambahkan session yang lain seperti password, dll
        res.redirect("/dashboard");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/dashboard", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// 1. Admin-Only (hanya adminHR yang boleh akses)
app.get("/admin", isAuthenticated, (req, res, next) => {
    if (req.session.user.username === "adminHR") {
        return next();
    } else {
        return res.status(403).send("Forbidden");
    }
}, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "admin.html"));
});


// 2. HR Department
app.get("/hr-department", isAuthenticated, authorizeABAC(user => user.department === "HR"), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "hr-department.html"));
});

// 3. Finance Manager with 5+ years
app.get("/finance-manager", isAuthenticated, authorizeABAC(user => user.department === "Finance" && user.role === "Manager" && user.seniority >= 5), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "finance-manager.html"));
});

// 4. IT Department with clearance >= 2
app.get("/it-clearance-2", isAuthenticated, authorizeABAC(user => user.department === "IT" && user.clearance >= 2), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "it-clearance-2.html"));
});

// 5. Director Legal with clearance 3
app.get("/legal-director", isAuthenticated, authorizeABAC(user => user.department === "Legal" && user.role === "Director" && user.clearance === 3), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "legal-director.html"));
});

// 6. Ops Staff with clearance 1 and seniority < 3
app.get("/ops-combined", isAuthenticated, authorizeABAC(user => user.department === "Operations" && user.role === "Staff" && user.clearance === 1 && user.seniority < 3), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "ops-combined.html"));
});

// 7. Exec with clearance 3, role Manager or Director, seniority >= 7
app.get("/exec-clearance-3", isAuthenticated, authorizeABAC(user =>
    (["Manager", "Director"].includes(user.role)) &&
    user.clearance === 3 &&
    user.seniority >= 7
), (req, res) => {
    res.sendFile(path.join(__dirname, "views", "exec-clearance-3.html"));
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
