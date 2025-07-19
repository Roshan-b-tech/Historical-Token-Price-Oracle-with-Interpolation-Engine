interface ProgressBarProps {
    progress: number;
    label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
    return (
        <div className="w-full max-w-md mx-auto mt-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">{progress}%</div>
                </div>
            </div>
        </div>
    );
};

export default ProgressBar; 