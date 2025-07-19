export interface TokenPriceRequest {
    token: string;
    network: 'ethereum' | 'polygon';
    timestamp?: number;
}

export interface TokenPriceResponse {
    price: number;
    source: 'cache' | 'alchemy' | 'interpolated';
    timestamp: number;
    token: string;
    network: string;
}

export interface ScheduleRequest {
    token: string;
    network: 'ethereum' | 'polygon';
}

export interface HistoricalPrice {
    token: string;
    network: string;
    date: string;
    price: number;
    timestamp: number;
}

export interface InterpolationPoint {
    timestamp: number;
    price: number;
} 