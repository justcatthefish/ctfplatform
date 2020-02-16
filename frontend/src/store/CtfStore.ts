import {flow, getParent, Instance, types} from "mobx-state-tree";
import {GetAnnouncements, GetCurrentTeam, GetInfo, GetScoreboard, GetTasks, GetTeams, ITeamResponse} from "@libs/api";
import {nullDate} from "@consts/index";
import {DateFromString} from "@libs/types";
import {func} from "prop-types";

export const Team = types
    .model({
        id: types.identifierNumber,
        api: types.model({
            id: types.optional(types.number, 0),
            name: types.optional(types.string, ""),
            avatar: types.optional(types.string, ""),
            country: types.optional(types.string, ""),
            affiliation: types.optional(types.string, ""),
            website: types.optional(types.string, ""),
            task_solved: types.optional(types.array(types.model({
                id: types.optional(types.number, 0),
                name: types.optional(types.string, ""),
                created_at: types.optional(DateFromString, nullDate),
            })), []),
            created_at: types.optional(DateFromString, nullDate),
        }),
    })
    .actions((self) => ({
    }));

export type ITeam = Instance<typeof Team>;


export const Scoreboard = types
    .model({
        id: types.identifierNumber,
        api: types.model({
            team: types.optional(types.model({
                id: types.optional(types.number, 0),
                name: types.optional(types.string, ""),
                avatar: types.optional(types.string, ""),
                country: types.optional(types.string, ""),
                affiliation: types.optional(types.string, ""),
                website: types.optional(types.string, ""),
                task_solved: types.optional(types.array(types.model({
                    id: types.optional(types.number, 0),
                    name: types.optional(types.string, ""),
                    created_at: types.optional(DateFromString, nullDate),
                })), []),
                created_at: types.optional(DateFromString, nullDate),
            }), {}),
            points: types.optional(types.number, 0),
        }),
    })
    .actions((self) => ({
    }));

export type IScoreboard = Instance<typeof Scoreboard>;


export const TaskCategory = types
    .model({
        id: types.identifier,
        name: types.optional(types.string, ""),
        color: types.optional(types.string, ""),
    })
    .actions((self) => ({
    }));

export type ITaskCategory = Instance<typeof TaskCategory>;


export const Task = types
    .model({
        id: types.identifierNumber,
        api: types.model({
            id: types.optional(types.number, 0),
            name: types.optional(types.string, ""),
            points: types.optional(types.number, 0),
            categories: types.optional(types.array(types.reference(TaskCategory)), []),
            difficult: types.optional(types.string, ""),
            description: types.optional(types.string, ""),
            solvers: types.optional(types.number, 0),
        }),
    })
    .views((self) => ({
        hasTaskSolved: function(): boolean {
            const store = getParent(getParent(self)) as ICtfStore;
            if(store.myTeam == null) {
                return false;
            }
            // TODO: low performance
            for(const audit of store.myTeam.api.task_solved) {
                if(audit.id === self.api.id) {
                    return true;
                }
            }
            return false;
        },
    }))
    .actions((self) => ({
    }));

export type ITask = Instance<typeof Task>;


export const MyTeam = types
    .model({
        id: types.identifierNumber,
        api: types.model({
            id: types.optional(types.number, 0),
            name: types.optional(types.string, ""),
            email: types.optional(types.string, ""),
            avatar: types.optional(types.string, ""),
            country: types.optional(types.string, ""),
            affiliation: types.optional(types.string, ""),
            website: types.optional(types.string, ""),
            task_solved: types.optional(types.array(types.model({
                id: types.optional(types.number, 0),
                name: types.optional(types.string, ""),
                created_at: types.optional(DateFromString, nullDate),
            })), []),
            created_at: types.optional(DateFromString, nullDate),
        }),
    })
    .actions((self) => ({
    }));

export type IMyTeam = Instance<typeof MyTeam>;


export const Announcement = types
    .model({
        id: types.identifierNumber,
        api: types.model({
            id: types.optional(types.number, 0),
            title: types.optional(types.string, ""),
            description: types.optional(types.string, ""),
            created_at: types.optional(DateFromString, nullDate),
        }),
    })
    .views((self) => ({
        isNew: function(): boolean {
            const store = getParent(getParent(self)) as ICtfStore;
            return !store.seenAnnouncements.includes(self.id)
        }
    }))
    .actions((self) => ({
    }));

export type IAnnouncement = Instance<typeof Announcement>;


const categoriesColors: Map<string, string> = new Map([
    ["web","42c6dc"],
    ["crypto","f79307"],
    ["pwn","fc289d"],
    ["re","4ee0ae"],
    ["misc","a46dfe"],
    ["stegano","c2d90a"],
    ["fore","f1de40"],
    ["ppc","ff6270"],
]);

export const CtfStore = types
    .model({
        infoState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        info: types.optional(types.model({
            start: types.optional(DateFromString, nullDate),
            end: types.optional(DateFromString, nullDate),
            flags_count: types.optional(types.number, 0),
            teams_count: types.optional(types.number, 0),
            countries_count: types.optional(types.number, 0),
            tasks_unsolved_count: types.optional(types.number, 0),
        }), {}),

        tasksState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        tasks: types.optional(types.map(Task), {}),
        categories: types.optional(types.map(TaskCategory), {}),

        scoreboardIsFreeze: types.optional(types.boolean, false),
        scoreboardState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        scoreboard: types.optional(types.map(Scoreboard), {}),

        announcementsState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        announcements: types.optional(types.map(Announcement), {}),
        seenAnnouncements: types.optional(types.array(types.number), []),

        myTeamState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        myTeam: types.optional(types.maybeNull(types.reference(MyTeam)), null),
        myTeams: types.optional(types.map(MyTeam), {}),  // only for hold real object

        teamsState: types.optional(types.enumeration("State", ["none", "pending", "done", "error"]), "none"),
        teams: types.optional(types.map(Team), {}),

        // session
        myTeamId: types.optional(types.number, 0),
        isLoggedIn: types.optional(types.boolean, false),
    })
    .views((self) => ({
        newAnnouncementsCount: function(): number {
            if(self.announcementsState !== "done") {
                return -1
            }

            return self.announcements.size - self.seenAnnouncements.length
        },
        filteredTasks: function(selectedCategories: Set<string>, showUnsolved: boolean): Map<string, ITask> {
            if(selectedCategories.size === 0 && !showUnsolved) {
                return self.tasks;
            }

            const tasksSolved: Set<number> = new Set();
            if(self.myTeam !== null) {
                for(const audit of self.myTeam.api.task_solved) {
                    tasksSolved.add(audit.id);
                }
            }

            const tasks = new Map();
            for(const task of self.tasks.values()) {
                let isFound = false;
                if(selectedCategories.size > 0) {
                    for (const category of task.api.categories) {
                        if (selectedCategories.has(category.id)) {
                            isFound = true;
                            break;
                        }
                    }
                } else {
                    isFound = true;
                }
                if(!isFound) {
                    continue
                }
                if(showUnsolved) {
                    if(tasksSolved.has(task.id)) {
                        continue;
                    }
                }

                tasks.set(task.id, task);
            }
            return tasks;
        }
    }))
    .actions((self) => ({
        setUserSession: (user: ITeamResponse) => {
            localStorage.setItem('teamID', String(user.id));
            self.myTeamId = user.id;
            self.isLoggedIn = true;
        },
        removeUserSession: () => {
            localStorage.removeItem('teamID');
            self.myTeamId = 0;
            self.isLoggedIn = false;
        },
        fetchInfo: flow(function* fetchInfo() {
            self.infoState = "pending";
            try {
                const [info, err] = yield GetInfo();
                if(err !== null || info === null) {
                    console.error("Failed to fetch", err);
                    self.teamsState = "error";
                    return
                }

                self.info = info;
                self.infoState = "done";
            } catch (error) {
                console.error("Failed to fetch", error);
                self.infoState = "error";
            }
        }),
        fetchTeams: flow(function* fetchTeams() {
            self.teams.clear();

            self.teamsState = "pending";
            try {
                const [listData, err] = yield GetTeams();
                if(err !== null) {
                    console.error("Failed to fetch", err);
                    self.teamsState = "error";
                    return
                }

                for(const data of listData) {
                    const row = Team.create({
                        id: data.id,
                        api: data,
                    });
                    self.teams.set(String(row.id), row);
                }
                self.teamsState = "done";
            } catch (error) {
                console.error("Failed to fetch", error);
                self.teamsState = "error";
            }
        }),
        fetchTasks: flow(function* fetchTasks() {
            self.tasks.clear();
            self.categories.clear();

            self.tasksState = "pending";
            try {
                const [listData, err] = yield GetTasks();
                if(err !== null) {
                    console.error("Failed to fetch", err);
                    self.tasksState = "error";
                    return
                }

                for(const data of listData) {
                    for(const categoryName of data.categories) {
                        const category = TaskCategory.create({
                            id: categoryName,
                            name: categoryName,
                            color: categoriesColors.get(categoryName) || "ff6270",
                        });
                        self.categories.set(category.id, category);
                    }
                    const row = Task.create({
                        id: data.id,
                        api: data,
                    });
                    self.tasks.set(String(row.id), row);
                }
                self.tasksState = "done";
            } catch (error) {
                console.error("Failed to fetch", error);
                self.tasksState = "error";
            }
        }),
        fetchScoreboard: flow(function* fetchScoreboard() {
            self.scoreboard.clear();

            self.scoreboardState = "pending";
            try {
                const [listData, isFreeze, err] = yield GetScoreboard();
                if (err !== null) {
                    console.error("Failed to fetch", err);
                    self.scoreboardState = "error";
                    return
                }

                for(const data of listData) {
                    const row = Scoreboard.create({
                        id: data.team.id,
                        api: data,
                    });
                    self.scoreboard.set(String(row.id), row);
                }
                self.scoreboardState = "done";
                self.scoreboardIsFreeze = isFreeze;
            } catch (error) {
                console.error("Failed to fetch", error);
                self.scoreboardState = "error";
            }
        }),
        setSeenAnnouncements: function() {
            if(self.announcementsState !== "done") {
                return;
            }
            const seen = Array.from(self.announcements.keys());
            localStorage.setItem('seenAnnouncements', seen.join(','));

            self.seenAnnouncements.clear();
            for(const id of seen) {
                self.seenAnnouncements.push(parseInt(id));
            }
        },
        fetchAnnouncements: flow(function* fetchAnnouncements() {
            self.announcements.clear();

            self.announcementsState = "pending";
            try {
                const [listData, err] = yield GetAnnouncements();
                if (err !== null) {
                    console.error("Failed to fetch", err);
                    self.announcementsState = "error";
                    return
                }

                for(const data of listData) {
                    const row = Announcement.create({
                        id: data.id,
                        api: data,
                    });
                    self.announcements.set(String(row.id), row);
                }
                self.announcementsState = "done";
            } catch (error) {
                console.error("Failed to fetch", error);
                self.announcementsState = "error";
            }
        }),
        fetchMyTeam: flow(function* fetchMyTeam() {
            if(!self.isLoggedIn) {
                return;
            }
            self.myTeam = null;

            self.myTeamState = "pending";
            try {
                const [data, err] = yield GetCurrentTeam();
                if (err !== null) {
                    console.error("Failed to fetch", err);
                    self.myTeamState = "error";
                    return
                }

                const team = MyTeam.create({
                    id: data.id,
                    api: data,
                });
                self.myTeams.set(String(team.id), team);
                self.myTeam = team;
                self.myTeamState = "done";
            } catch (error) {
                console.error("Failed to fetch", error);
                self.myTeamState = "error";
            }
        }),
    })).actions((self) => ({
        afterCreate: () => {
            // load session
            let data = localStorage.getItem('teamID');
            if(data == null) {
                return;
            }
            self.myTeamId = parseInt(data);
            self.isLoggedIn = true;

            // others
            const rawStore = localStorage.getItem('seenAnnouncements') || '';
            if(rawStore.length > 0) {
                for(const id of rawStore.split(',')) {
                    self.seenAnnouncements.push(parseInt(id));
                }
            }

            // init intervals
            setTimeout(() => {
                if(self.announcementsState === "none") {
                    self.fetchAnnouncements();
                }
            }, 1 * 1000);  // 5s
            setInterval(() => {
                if(self.announcementsState !== "pending") {
                    self.fetchAnnouncements();
                }
            }, 45 * 1000);  // 45s
        },
    }));

export type ICtfStore = Instance<typeof CtfStore>;
