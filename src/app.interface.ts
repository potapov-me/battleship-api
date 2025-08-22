export interface HealthStatus {
  status: string;
  timestamp: string;
  services?: {
    redis: boolean;
  };
}
