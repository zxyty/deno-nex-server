
export interface NexRequest {
    ctx?: any;
    url?: string;
    query?: {
        [key: string]: string;
    };
    method?: string;
    proto?: string;
    params?: {
        [key: string]: string;
    };
    headers?: {
        [key: string]: string;
    };
    body?: any;
}
