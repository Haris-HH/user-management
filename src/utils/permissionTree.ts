// Types
import type { LprCenterPermissionNode } from "../constants/lprCenterPermissions";

export type NodeCheckState = "checked" | "indeterminate" | "unchecked";

const hasChildren = (
  node: LprCenterPermissionNode
): node is LprCenterPermissionNode & { children: LprCenterPermissionNode[] } =>
  Array.isArray(node.children) && node.children.length > 0;

/** Every persisted key beneath (and including) `node`. Parents are not persisted. */
export const collectLeafKeys = (node: LprCenterPermissionNode): string[] => {
  if (!hasChildren(node)) return [node.key];
  return node.children.flatMap(collectLeafKeys);
};

export const collectAllLeafKeys = (
  nodes: readonly LprCenterPermissionNode[]
): string[] => nodes.flatMap(collectLeafKeys);

/** Valid persisted keys, used to reject unknown keys coming back from the API. */
export const buildValidLeafKeySet = (
  nodes: readonly LprCenterPermissionNode[]
): Set<string> => new Set(collectAllLeafKeys(nodes));

/*
  A parent is checked only when every descendant leaf is selected, and
  indeterminate when some but not all are. Derived on read rather than stored,
  so it can never disagree with the leaves it summarises.
*/
export const getNodeCheckState = (
  node: LprCenterPermissionNode,
  selected: ReadonlySet<string>
): NodeCheckState => {
  const leaves = collectLeafKeys(node);

  if (leaves.length === 0) return "unchecked";

  let selectedCount = 0;
  for (const leaf of leaves) {
    if (selected.has(leaf)) selectedCount++;
  }

  if (selectedCount === 0) return "unchecked";
  if (selectedCount === leaves.length) return "checked";

  return "indeterminate";
};

/** Selecting a parent selects every descendant leaf; clearing it clears them. */
export const toggleNodeSelection = (
  node: LprCenterPermissionNode,
  selected: ReadonlySet<string>,
  nextChecked: boolean
): Set<string> => {
  const next = new Set(selected);

  for (const leaf of collectLeafKeys(node)) {
    if (nextChecked) next.add(leaf);
    else next.delete(leaf);
  }

  return next;
};

export const collectAllNodeKeys = (
  nodes: readonly LprCenterPermissionNode[]
): string[] =>
  nodes.flatMap((node) => [
    node.key,
    ...(hasChildren(node) ? collectAllNodeKeys(node.children) : []),
  ]);

/*
  Filters the tree to nodes matching `query`. A parent is kept when it matches
  itself (with its whole subtree, so it stays operable) or when any descendant
  matches (narrowed to the matching descendants).
*/
export const filterPermissionTree = (
  nodes: readonly LprCenterPermissionNode[],
  query: string,
  labelOf: (node: LprCenterPermissionNode) => string
): LprCenterPermissionNode[] => {
  const needle = query.trim().toLowerCase();

  if (!needle) return [...nodes];

  const walk = (list: readonly LprCenterPermissionNode[]): LprCenterPermissionNode[] =>
    list.reduce<LprCenterPermissionNode[]>((acc, node) => {
      const selfMatches = labelOf(node).toLowerCase().includes(needle);

      if (selfMatches) {
        acc.push(node);
        return acc;
      }

      if (hasChildren(node)) {
        const matchedChildren = walk(node.children);

        if (matchedChildren.length > 0) {
          acc.push({ ...node, children: matchedChildren });
        }
      }

      return acc;
    }, []);

  return walk(nodes);
};

export const isLeafNode = (node: LprCenterPermissionNode): boolean =>
  !hasChildren(node);
