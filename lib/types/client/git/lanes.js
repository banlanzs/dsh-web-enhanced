/**
 * Commit lane assignment for the git graph. Pure: commits in, rows with lane
 * indices and edges out — no DOM, no host calls, so the layout is testable on
 * its own.
 *
 * The algorithm is the usual one-pass railway walk over a newest-first commit
 * list. A lane is a column that currently EXPECTS a specific commit hash. For
 * each commit: take the leftmost lane expecting it (or open a fresh lane when
 * none does, which is how a tip enters); that lane then expects the commit's
 * first parent, and every additional parent opens or reuses another lane. A
 * lane whose expectation is satisfied by nothing further goes idle and is
 * reused by the next tip, which keeps the graph narrow instead of growing a
 * column per branch ever seen.
 * @module dsh-web-enhanced/src/client/git/lanes
 */
/**
 * Lay commits out on lanes.
 * @param commits - commits newest first, as `git log --date-order` returns them.
 * @returns rows in input order plus the column count.
 */
export function layoutLanes(commits) {
    // lanes[i] is the hash lane i currently expects, or undefined when idle.
    const lanes = [];
    const rows = [];
    let width = 0;
    /** Leftmost lane expecting `hash`, or -1. */
    const laneExpecting = (hash) => lanes.indexOf(hash);
    /** Leftmost idle lane, opening a new column when all are busy. */
    const takeIdleLane = () => {
        const idle = lanes.indexOf(undefined);
        if (idle !== -1)
            return idle;
        lanes.push(undefined);
        return lanes.length - 1;
    };
    for (const commit of commits) {
        let lane = laneExpecting(commit.hash);
        if (lane === -1)
            lane = takeIdleLane();
        // Merges are drawn once: any other lane also waiting on this commit folds
        // into the chosen one instead of leaving a duplicate rail behind.
        for (let index = 0; index < lanes.length; index++) {
            if (index !== lane && lanes[index] === commit.hash)
                lanes[index] = undefined;
        }
        const parentLanes = [];
        const [first, ...rest] = commit.parents;
        if (first === undefined) {
            // A root commit ends its lane.
            lanes[lane] = undefined;
        }
        else {
            const existing = laneExpecting(first);
            if (existing === -1 || existing === lane) {
                lanes[lane] = first;
                parentLanes.push(lane);
            }
            else {
                // The first parent already has a rail: this lane merges into it.
                lanes[lane] = undefined;
                parentLanes.push(existing);
            }
        }
        for (const parent of rest) {
            const existing = laneExpecting(parent);
            if (existing !== -1) {
                parentLanes.push(existing);
                continue;
            }
            const fresh = takeIdleLane();
            lanes[fresh] = parent;
            parentLanes.push(fresh);
        }
        const through = [];
        for (let index = 0; index < lanes.length; index++) {
            if (lanes[index] !== undefined)
                through.push(index);
        }
        width = Math.max(width, lanes.length);
        rows.push({ commit, lane, through, parentLanes });
    }
    return { rows, width: Math.max(width, rows.length === 0 ? 0 : 1) };
}
/**
 * Place the uncommitted-changes row against HEAD.
 *
 * It is drawn where HEAD is rather than always on top, because that is what it
 * describes: with `--all` the newest commit in view may belong to another
 * branch entirely. When HEAD is not among the drawn rows — the graph is
 * filtered to a branch that is not checked out, or HEAD fell past the row cap —
 * the row goes to the top on lane 0 with nothing to connect to, because the
 * changes are still real even though their base is off-screen.
 * @param rows - the laid-out commit rows.
 * @param head - HEAD's commit hash.
 * @returns the placement.
 */
export function placeWorking(rows, head) {
    const index = rows.findIndex(row => row.commit.hash === head);
    if (index === -1)
        return { index: 0, lane: 0, through: [] };
    const lane = rows[index].lane;
    // Lanes alive between the row above and HEAD's row are exactly what the row
    // above reports as continuing below it.
    const above = index === 0 ? [] : rows[index - 1].through;
    return { index, lane, through: above.filter(candidate => candidate !== lane) };
}
/** Stable colour index of a lane (the renderer maps it onto its palette). */
export function laneColor(lane, paletteSize) {
    return paletteSize <= 0 ? 0 : lane % paletteSize;
}
/**
 * Short display form of a commit hash.
 * @param hash - full hash.
 * @returns the first seven characters.
 */
export function shortHash(hash) {
    return hash.slice(0, 7);
}
