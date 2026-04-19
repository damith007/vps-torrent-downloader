export interface FileInfo {
  name: string;
  size: number;
  mtime: string;
  type: string;
}

export interface ActiveDownload {
  id: string;
  url: string;
  filename: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  size: number;
  downloaded: number;
  error?: string;
}

export interface SystemStats {
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  cpu: {
    model: string;
    cores: number;
    loadAvg: number;
  };
  uptime: number;
  platform: string;
}
