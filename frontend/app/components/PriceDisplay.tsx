import { TrendingUp, Database, Zap, BarChart3, Clock } from 'lucide-react';
import { TokenPriceResponse } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PriceDisplayProps {
    result: TokenPriceResponse | null;
    history?: { timestamp: number; price: number }[];
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ result, history }) => {
    if (!result) return null;

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'cache':
                return <Database className="w-5 h-5 text-green-500" />;
            case 'alchemy':
                return <Zap className="w-5 h-5 text-blue-500" />;
            case 'interpolated':
                return <BarChart3 className="w-5 h-5 text-purple-500" />;
            default:
                return <TrendingUp className="w-5 h-5 text-gray-500" />;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'cache':
                return 'Cached';
            case 'alchemy':
                return 'Live';
            case 'interpolated':
                return 'Interpolated';
            default:
                return 'Unknown';
        }
    };

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'cache':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'alchemy':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'interpolated':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="w-full max-w-md mx-auto mt-6">
            <div className="glass p-8 rounded-3xl shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4 shadow-lg">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Price Result</h3>
                </div>

                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-4xl font-extrabold text-white mb-2 drop-shadow">
                            ${result.price.toFixed(4)}
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getSourceColor(result.source)}`}>
                            {getSourceIcon(result.source)}
                            {getSourceLabel(result.source)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                            <div className="text-xs text-gray-300 mb-1">Token</div>
                            <div className="text-sm font-mono text-white break-all">
                                {result.token.slice(0, 6)}...{result.token.slice(-4)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-300 mb-1">Network</div>
                            <div className="text-sm font-medium text-white capitalize">
                                {result.network}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(result.timestamp)}</span>
                        </div>
                    </div>

                    {/* Chart */}
                    {history && history.length > 0 && (
                        <div className="mt-8 bg-white/5 rounded-xl p-4 shadow-inner">
                            <h4 className="text-gray-200 text-center mb-2">Historical Price Chart</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={ts => new Date(ts * 1000).toLocaleDateString()}
                                        stroke="#aaa"
                                        label={{ value: "Date", position: "insideBottomRight", offset: -5, fill: "#aaa" }}
                                    />
                                    <YAxis
                                        stroke="#aaa"
                                        label={{ value: "Price", angle: -90, position: "insideLeft", fill: "#aaa" }}
                                    />
                                    <Tooltip
                                        labelFormatter={ts => new Date(ts * 1000).toLocaleString()}
                                        formatter={v => `$${v.toFixed(2)}`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#00ffe7"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceDisplay; 