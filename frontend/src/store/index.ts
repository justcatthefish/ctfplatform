import { CtfStore } from "@store/CtfStore";
import { flow, Instance, types } from "mobx-state-tree";

export const RootStore = types
    .model({
        ctf: types.optional(CtfStore, {}),
    });

export type IRootStore = Instance<typeof RootStore>;
