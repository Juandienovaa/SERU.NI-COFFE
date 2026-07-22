import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export const chartToImageService = {
  async generateChart(config: ChartConfiguration, width = 800, height = 400): Promise<string> {
    return new Promise((resolve) => {
      // Create offscreen canvas container
      const container = document.createElement('div');
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      container.appendChild(canvas);
      document.body.appendChild(container);

      // Force no animation for instant rendering
      if (!config.options) config.options = {};
      config.options.animation = false;
      config.options.responsive = false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        document.body.removeChild(container);
        return resolve('');
      }

      const chartInstance = new Chart(ctx, config);

      // Give it a tiny tick to render
      setTimeout(() => {
        const base64 = chartInstance.toBase64Image();
        chartInstance.destroy();
        document.body.removeChild(container);
        resolve(base64);
      }, 50);
    });
  }
};
