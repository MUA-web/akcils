import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
    return (
        <div className="splash-container">
            <div className="splash-content">
                <div className="splash-logo">
                    <div className="logo-outer">
                        <div className="logo-inner"></div>
                    </div>
                </div>
                <h1 className="splash-title">MB SARARI</h1>
                <div className="splash-loader">
                    <div className="loader-bar"></div>
                </div>
                <p className="splash-subtitle">Premium Admin Dashboard</p>
            </div>
        </div>
    );
};

export default SplashScreen;
