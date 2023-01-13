export default interface {
  action: {
    cancel: string,
    close: string,
    download: string,
    enterFullscreen: string,
    exitFullscreen: string,
    fitToPage: string,
    fitToWidth: string,
    pagePrev: string,
    pageNext: string,
    print: string,
    ok: string,
    submit: string,
    zoomIn: string,
    zoomOut: string,
    zoomControls: string,
    darkMode: string,
    lightMode: string
  },
  component: {
    thumbnailPanel: string,
    zoomOverlay: string
  },
  message: {
    badDocument: string,
    enterPassword: string,
    incorrectPassword: string,
    notSupported: string,
    passwordRequired: string,
    warning: string
  },
  shortcut: {
    zoomIn: string,
    zoomOut: string
  }
}