export interface ModelProps {
    /**
     * Set color of the model
     */
    readonly interior: string;
    /**
     * Set color of the model
     */
    readonly exterior: string;
    /**
     * To show or hide model
     */
    readonly visible: boolean
    /**
     * Key of the component
     */
    readonly key: string
}


export const models = ["ARCHON"] as const;
export type Model = typeof models[number];