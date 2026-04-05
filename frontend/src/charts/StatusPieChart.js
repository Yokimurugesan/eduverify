import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusPieChart = ({ data }) => {
  const chartData = {
    labels: ['Verified', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [data.verified || 65, data.pending || 25, data.rejected || 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green-500
          'rgba(234, 179, 8, 0.8)', // yellow-500
          'rgba(239, 68, 68, 0.8)', // red-500
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 10
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 13
          }
        }
      },
      tooltip: {
        padding: 12,
        cornerRadius: 8,
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1500
    }
  };

  return (
    <div className="h-64 md:h-80 w-full animate-fade-in-up">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default StatusPieChart;
