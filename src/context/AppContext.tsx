const addKnownGroup = useCallback(async (group: KnownGroup) => {
  setKnownGroups((p) => [group, ...p]);
  try {
    const saved = await post("known-groups", {
      id: group.id, name: group.name,
      members: group.members.map((m) => ({ id: m.id, name: m.name })),
      fixedJoiners: group.fixedJoiners ?? [],
    });
    setKnownGroups((p) => p.map((x) => x.id === group.id ? parseJsonFields(saved) : x));
  } catch (e) {
    console.error(e);
    setKnownGroups((p) => p.filter((x) => x.id !== group.id));
  }
}, []);

const updateKnownGroup = useCallback(async (id: string, updates: Partial<KnownGroup>) => {
  setKnownGroups((p) => p.map((x) => x.id === id ? { ...x, ...updates } : x));
  await put(`known-groups/${id}`, {
    name: updates.name,
    members: (updates.members ?? []).map((m) => ({ id: m.id, name: m.name })),
    fixedJoiners: updates.fixedJoiners ?? [],
  }).catch(console.error);
}, []);

const deleteKnownGroup = useCallback(async (id: string) => {
  setKnownGroups((p) => p.filter((x) => x.id !== id));
  await del(`known-groups/${id}`).catch(console.error);
}, []);
