const express = require('express');
require("dotenv").config();
const cors = require('cors')
const app = express();
const connectDB = require('./config/dbConnection')
const adsAdminRoute = require('./routes/adminRoutes/advertismentAdmin/adminAdvertismentRoutes')
const userRoutes = require('./routes/userRoutes/userRoutes')
const advertiserRoutes = require("./routes/userAdvertiserRoutes/advertiserRoutes")
const reporterRoutes = require("./routes/reporterRoutes/reporterFetchAds")
const reporterAdminRoutes = require('./routes/adminRoutes/reporterAdmin/adminReporterRoutes')
const adminAuth = require('./routes/adminRoutes/adminAuth/adminAuth') 
const raiseYourVoiceRoutes = require("./routes/RaiseYourVoice/raiseYourVoiceRoutes")
const adminRaiseYourVoice = require("./routes/adminRoutes/adminRaiseYourVoice/raiseYourVoiceStatus")
const publicReporterRoutes = require("./routes/publicRoutes/publicReporterRoutes")
const path = require('path')
const multerErrorHandler = require('./middlewares/multer/errorHandler')

// Configure JSON parsing with increased limit
app.use(express.json({ limit: '300mb' })); 

// Configure URL-encoded data parsing with increased limit
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// Allow access from all websites/origins
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: '*',
    credentials: true
}))



try{
    connectDB()
    app.use('/upload', express.static(path.join(__dirname,'upload')))

    // Apply multer error handler middleware
    app.use(multerErrorHandler)
    
    //Routes
    app.use('/api/public', publicReporterRoutes) // Public routes - no authentication required
    app.use(adsAdminRoute)
    app.use(userRoutes)
    app.use(advertiserRoutes)
    app.use(reporterRoutes)
    app.use(reporterAdminRoutes)
    app.use(adminAuth)
    app.use(raiseYourVoiceRoutes)
    app.use(adminRaiseYourVoice)


    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
}
catch(err)
{
    console.error("Startup Error:", err)
}



