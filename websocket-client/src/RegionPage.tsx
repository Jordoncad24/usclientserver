import React from 'react';
import { useParams } from 'react-router-dom';

interface WorkerStats {
  wait_time: number;
  workers: number;
  waiting: number;
  idle: number;
  time_to_return: number;
  recently_blocked_keys: [string, number, string][];
  top_keys: [string, number][];
}

interface ServerStats {
  active_connections: number;
  wait_time: number;
  workers: [string, WorkerStats][];
  cpu_load: number;
  timers: number;
}

interface ResultData {
  services: {
    redis: boolean;
    database: boolean;
  };
  stats: {
    servers_count: number;
    online: number;
    session: number;
    server: ServerStats;
  };
}

interface RegionData {
  status: string;
  region: string;
  results: ResultData;
  lastChecked: string;
}

interface RegionPageProps {
  data: RegionData[];
}

const RegionPage: React.FC<RegionPageProps> = ({ data }) => {
  const { regionId } = useParams<{ regionId: string }>();
  const regionData = data.find((region) => region.region === regionId);

  if (!regionData) {
    return <p>Region not found</p>;
  }

  return (
    <div className="region-status">
      <h2>Region: {regionData.region.toUpperCase()}</h2>
      <p>Status: <span className={`status-${regionData.status.toLowerCase()}`}>{regionData.status}</span></p>
      <p>Last Checked: {new Date(regionData.lastChecked).toLocaleString()}</p>
      <div className="services">
        <h3>Services Status</h3>
        <p>Redis: {regionData.results.services.redis ? 'Online' : 'Offline'}</p>
        <p>Database: {regionData.results.services.database ? 'Online' : 'Offline'}</p>
      </div>
      <div className="server-stats">
        <h3>Server Stats</h3>
        <p>Servers Count: {regionData.results.stats.servers_count}</p>
        <p>Online: {regionData.results.stats.online}</p>
        <p>Sessions: {regionData.results.stats.session}</p>
        <p>Active Connections: {regionData.results.stats.server.active_connections}</p>
        <p>CPU Load: {regionData.results.stats.server.cpu_load * 100}%</p>
        <p>Timers: {regionData.results.stats.server.timers}</p>
      </div>
      <div className="worker-stats">
        <h3>Worker Stats</h3>
        {regionData.results.stats.server.workers.map(([name, stats]) => (
          <div key={name} className="worker">
            <h4>{name.replace(/_/g, ' ').toUpperCase()}</h4>
            <p>Workers: {stats.workers}</p>
            <p>Waiting: {stats.waiting}</p>
            <p>Idle: {stats.idle}</p>
            <p>Wait Time: {stats.wait_time} ms</p>
            <h5>Top Keys</h5>
            <ul>
              {stats.top_keys.map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
            <h5>Recently Blocked Keys</h5>
            <ul>
              {stats.recently_blocked_keys.map(([key, count, timestamp]) => (
                <li key={key}>{key} - {count} times (Last Blocked: {new Date(timestamp).toLocaleString()})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionPage
