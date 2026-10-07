// La librairie xlsx n'embarque pas ses types : déclaration minimale
// (les 3 fichiers l'utilisant ne sont pas bundlés, mais tsc les contrôle).
declare module 'xlsx' {
    const XLSX: any;
    export default XLSX;
    export const utils: any;
    export function writeFile(...args: any[]): void;
    export function read(...args: any[]): any;
}
