import { useState } from 'react';
import { Search, Clock, TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import { TokenPriceRequest, TokenPriceResponse } from '../types';
import { toast } from 'react-hot-toast';

interface TokenPriceFormProps {
    onPriceResult: (result: TokenPriceResponse) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
}

const TokenPriceForm: React.FC<TokenPriceFormProps> = ({ onPriceResult, loading, setLoading }) => {
    const [formData, setFormData] = useState<TokenPriceRequest>({
        token: '',
        network: 'ethereum',
        timestamp: undefined
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResponse: TokenPriceResponse = {
                price: Math.random() * 1000 + 100,
                source: Math.random() > 0.5 ? 'cache' : 'interpolated',
                timestamp: formData.timestamp || Date.now() / 1000,
                token: formData.token,
                network: formData.network
            };

            onPriceResult(mockResponse);
        } catch (error) {
            console.error('Error fetching price:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async () => {
        setLoading(true);
        try {
            // Simulate schedule API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success('Historical data collection scheduled successfully!');
        } catch (error) {
            console.error('Error scheduling:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="card p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100 mb-2">Token Price Oracle</h2>
                    <p className="text-gray-400">Get historical prices with interpolation</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                            Token Address
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={formData.token}
                                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                placeholder="0xA0b86a33E6612..."
                                className="w-full pl-10 pr-4 py-3"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                            Network
                        </label>
                        <select
                            value={formData.network}
                            onChange={(e) => setFormData({ ...formData, network: e.target.value as 'ethereum' | 'polygon' })}
                            className="w-full px-4 py-3"
                        >
                            <option value="ethereum">Ethereum</option>
                            <option value="polygon">Polygon</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                            Timestamp (Optional)
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="number"
                                value={formData.timestamp || ''}
                                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value ? parseInt(e.target.value) : undefined })}
                                placeholder="1678901234"
                                className="w-full pl-10 pr-4 py-3"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Leave empty for current price</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            {loading ? 'Fetching...' : 'Get Price'}
                        </button>

                        <button
                            type="button"
                            onClick={handleSchedule}
                            disabled={loading}
                            className="flex items-center justify-center"
                        >
                            <BarChart3 className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TokenPriceForm; 