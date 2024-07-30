// html2canvas.d.ts

declare module 'html2canvas' {
    function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;

    export interface Html2CanvasOptions {
        /** Whether to allow cross-origin images to taint the canvas */
        allowTaint?: boolean;

        /** Canvas background color, if none is specified in DOM. Set null for transparent */
        backgroundColor?: string | null;

        /** Existing canvas element to use as a base for drawing on */
        canvas?: HTMLCanvasElement;

        /** Whether to use ForeignObject rendering if the browser supports it */
        foreignObjectRendering?: boolean;

        /** Timeout for loading an image (in milliseconds). Set to 0 to disable timeout. */
        imageTimeout?: number;

        /** Predicate function which removes the matching elements from the render. */
        ignoreElements?: (element: Element) => boolean;

        /** Enable logging for debug purposes */
        logging?: boolean;

        /** Callback function which is called when the Document has been cloned for rendering */
        onclone?: (document: Document) => void;

        /** Url to the proxy which is to be used for loading cross-origin images. If left empty, cross-origin images won't be loaded. */
        proxy?: string | null;

        /** Whether to cleanup the cloned DOM elements html2canvas creates temporarily */
        removeContainer?: boolean;

        /** The scale to use for rendering. Defaults to the browsers device pixel ratio. */
        scale?: number;

        /** Whether to attempt to load images from a server using CORS */
        useCORS?: boolean;

        /** The width of the canvas */
        width?: number;

        /** The height of the canvas */
        height?: number;

        /** Crop canvas x-coordinate */
        x?: number;

        /** Crop canvas y-coordinate */
        y?: number;

        /** The x-scroll position to used when rendering element */
        scrollX?: number;

        /** The y-scroll position to used when rendering element */
        scrollY?: number;

        /** Window width to use when rendering Element, which may affect things like Media queries */
        windowWidth?: number;

        /** Window height to use when rendering Element, which may affect things like Media queries */
        windowHeight?: number;
    }

    export default html2canvas;
}