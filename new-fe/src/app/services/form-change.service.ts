import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class FormChangeService {
    /**
     * Deep-clone an object for use as a comparison snapshot.
     * Handles Date (cloned), Array (shallow copy of array), plain objects (recursive).
     * Any new property added to the form later will be compared when using hasChanges.
     */
    takeSnapshot<T extends Record<string, unknown>>(obj: T): T {
        const out = {} as Record<string, unknown>;
        for (const key of Object.keys(obj)) {
            out[key] = this.cloneValue(obj[key]);
        }
        return out as T;
    }

    /**
     * Returns true if current differs from snapshot (deep equality).
     * Compares all keys present in either object; safe for new fields on current.
     */
    hasChanges(
        current: Record<string, unknown>,
        snapshot: Record<string, unknown>,
    ): boolean {
        const keys = Array.from(
            new Set([...Object.keys(current), ...Object.keys(snapshot)]),
        );
        for (const k of keys) {
            if (!this.valueEqual(current[k], snapshot[k])) return true;
        }
        return false;
    }

    /**
     * Deep equality for two values: null/undefined, Date, Array (order-independent),
     * plain object (recursive), primitives.
     */
    valueEqual(a: unknown, b: unknown): boolean {
        const aNull = a == null;
        const bNull = b == null;
        if (aNull && bNull) return true;
        if (aNull || bNull) return false;
        if (a instanceof Date && b instanceof Date)
            return a.getTime() === b.getTime();
        if (Array.isArray(a) && Array.isArray(b))
            return this.arrayEqualOrderIndependent(a, b);
        if (
            typeof a === "object" &&
            typeof b === "object" &&
            a !== null &&
            b !== null &&
            !Array.isArray(a) &&
            !Array.isArray(b) &&
            !(a instanceof Date) &&
            !(b instanceof Date)
        ) {
            return !this.hasChanges(
                a as Record<string, unknown>,
                b as Record<string, unknown>,
            );
        }
        return a === b;
    }

    private cloneValue(v: unknown): unknown {
        if (v == null) return v;
        if (v instanceof Date) return new Date(v.getTime());
        if (Array.isArray(v)) return v.map((item) => this.cloneValue(item));
        if (
            typeof v === "object" &&
            v !== null &&
            !(v instanceof Date) &&
            Object.getPrototypeOf(v) === Object.prototype
        ) {
            const out: Record<string, unknown> = {};
            for (const key of Object.keys(v as Record<string, unknown>)) {
                out[key] = this.cloneValue((v as Record<string, unknown>)[key]);
            }
            return out;
        }
        return v;
    }

    private arrayEqualOrderIndependent(a: unknown[], b: unknown[]): boolean {
        if (a.length !== b.length) return false;
        return (
            a.every((av) => b.some((bv) => this.valueEqual(av, bv))) &&
            b.every((bv) => a.some((av) => this.valueEqual(av, bv)))
        );
    }
}
