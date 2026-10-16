export type AuthEvent = 
    | { type: "session-expiring" }
    | { type: "session-cleared"; reason: "logout" | "expired" };

type AuthEventListener = (event: AuthEvent) => void;

const listeners = new Set<AuthEventListener>();

export const authEvents = {
    subscribe(listener: AuthEventListener): () => void {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    },

    emit(event: AuthEvent): void {
        for (const listener of listeners) {
            listener(event);
        }
    }
}
