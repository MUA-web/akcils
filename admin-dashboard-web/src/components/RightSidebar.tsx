import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import './RightSidebar.css';

const data = [
    { name: '1-10 Aug', pv: 30 },
    { name: '11-20 Aug', pv: 45 },
    { name: ' ', pv: 25 },
    { name: '21-30 Aug', pv: 60 },
    { name: '  ', pv: 25 },
];



const RightSidebar = () => {
    return (
        <aside className="right-sidebar">
            <div className="rs-header">
                <h2>Statistic</h2>
                <button className="rs-more-btn">⋮</button>
            </div>

            <div className="stat-circle-wrapper">
                <div className="stat-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                            className="circle-bg"
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="circle"
                            strokeDasharray="32, 100"
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="stat-avatar-wrapper">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jason" alt="Jason" className="stat-avatar" />
                    </div>
                    <div className="stat-badge">32%</div>
                </div>
            </div>

            <div className="greeting-section">
                <h3>Good Morning Jason 🔥</h3>
                <p>Continue your learning to achieve your target!</p>
            </div>

            <div className="chart-card">
                <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data}>
                        <Bar dataKey="pv" fill="#2563EB" radius={[4, 4, 4, 4]} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#a0a0a0' }}
                            dy={10}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>


        </aside>
    );
};

export default RightSidebar;
