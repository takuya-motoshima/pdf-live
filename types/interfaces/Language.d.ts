export default interface  {
    action: {
        cancel: string;
        close: string;
        download: string;
        enterFullscreen: string;
        exitFullscreen: string;
        fitToPage: string;
        fitToWidth: string;
        pagePrev: string;
        pageNext: string;
        print: string;
        ok: string;
        submit: string;
        zoomIn: string;
        zoomOut: string;
        darkMode: string;
        lightMode: string;
    };
    component: {
        leftPanel: string;
        zoomOverlay: string;
    };
    message: {
        badDocument: string;
        enterPassword: string;
        incorrectPassword: string;
        notSupported: string;
        passwordRequired: string;
        warning: string;
    };
    shortcut: {
        zoomIn: string;
        zoomOut: string;
    };
}
