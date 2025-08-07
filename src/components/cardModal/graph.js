export function renderGraph(conditionId, data, container) {
  const graphWrapper = document.createElement("div");
  graphWrapper.className = "graph-wrapper";

  const canvas = document.createElement("canvas");
  canvas.id = `chart-condition-${conditionId}`;
  graphWrapper.appendChild(canvas);
  container.appendChild(graphWrapper);

  let config;

  if (conditionId === 2) {
    const dps = data?.DPS;
    if (!dps) return;

    const years = Object.keys(dps);
    const values = years.map(y => parseFloat(dps[y]));

    config = {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: "DPS (€)",
          data: values,
          backgroundColor: 'rgba(79, 192, 210, 0.6)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  if (config) new Chart(canvas, config);
 
}
