let pagerController = null;

export const setPagerController = (controller) => {
  pagerController = controller;
};

export const goToScreen = (screen) => {
  if (!pagerController) return;

  const pages = {
    dashboard: 0,
    history: 1,
    alerts: 2,
    settings: 3,
  };

  pagerController.setPage(pages[screen]);
};