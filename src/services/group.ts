import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';

export interface Member {
    id: string;
    name: string;
    email?: string;
    isVirtual?: boolean;
    upiId?: string;
}

export interface Group {
    id: string;
    name: string;
    members: Member[];
    createdBy: string;
    createdAt: any;
}

const GROUPS_STORAGE_KEY = 'bill_splitter_groups';
const USER_PROFILE_KEY = 'bill_splitter_user_profile';

export const saveUserProfile = async (upiId: string) => {
    try {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify({ upiId }));
    } catch (error) {
        console.error('Error saving user profile:', error);
    }
};

export const getUserProfile = async (): Promise<{ upiId?: string }> => {
    try {
        const json = await AsyncStorage.getItem(USER_PROFILE_KEY);
        return json ? JSON.parse(json) : {};
    } catch (error) {
        return {};
    }
};

const getGroupsFromStorage = async (): Promise<Group[]> => {
    try {
        const existingGroupsJson = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
        if (!existingGroupsJson) return [];

        const existingGroups: any[] = JSON.parse(existingGroupsJson);

        // Migrate legacy groups (where members is string[])
        const migratedGroups: Group[] = existingGroups.map(group => {
            if (group.members && group.members.length > 0 && typeof group.members[0] === 'string') {
                console.log(`Migrating group ${group.id} to new member format`);
                return {
                    ...group,
                    members: group.members.map((id: string) => ({
                        id,
                        name: 'Member', // Default name
                        isVirtual: false
                    }))
                };
            }
            return group;
        });

        // If we found legacy groups, save the migrated version back
        if (JSON.stringify(existingGroups) !== JSON.stringify(migratedGroups)) {
            await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(migratedGroups));
        }

        return migratedGroups;
    } catch (error) {
        console.error('Error reading/migrating groups:', error);
        return [];
    }
};

export const createGroup = async (name: string): Promise<string> => {
    const user = auth.currentUser;
    console.log('createGroup service called (Local). Current user:', user?.uid);
    if (!user) {
        console.error('User not authenticated in createGroup');
        throw new Error("User not authenticated");
    }

    try {
        // Get user's name from profile or default
        const memberName = user.displayName || user.email?.split('@')[0] || 'You';
        const userProfile = await getUserProfile();

        const newGroup: Group = {
            id: Date.now().toString(),
            name,
            members: [{
                id: user.uid,
                name: memberName,
                email: user.email || undefined,
                isVirtual: false,
                upiId: userProfile.upiId
            }],
            createdBy: user.uid,
            createdAt: new Date().toISOString()
        };

        const existingGroups = await getGroupsFromStorage();
        const updatedGroups = [...existingGroups, newGroup];
        await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));

        console.log('Group created locally with ID:', newGroup.id);
        return newGroup.id;
    } catch (error: any) {
        console.error('AsyncStorage error:', error);
        throw new Error(error.message);
    }
};

export const getUserGroups = async (): Promise<Group[]> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const existingGroups = await getGroupsFromStorage();

        // Filter groups where the user is a member
        const userGroups = existingGroups.filter(group =>
            group.members.some(m => m.id === user.uid)
        );
        return userGroups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const joinGroup = async (groupId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const existingGroups = await getGroupsFromStorage();

        const groupIndex = existingGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) {
            throw new Error("Group not found");
        }

        if (!existingGroups[groupIndex].members.some(m => m.id === user.uid)) {
            const memberName = user.displayName || user.email?.split('@')[0] || 'Member';
            const userProfile = await getUserProfile();

            existingGroups[groupIndex].members.push({
                id: user.uid,
                name: memberName,
                email: user.email || undefined,
                isVirtual: false,
                upiId: userProfile.upiId
            });
            await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(existingGroups));
        }
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const getGroup = async (groupId: string): Promise<Group> => {
    try {
        const existingGroups = await getGroupsFromStorage();

        const group = existingGroups.find(g => g.id === groupId);
        if (group) {
            return group;
        } else {
            throw new Error("No such group!");
        }
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const addMemberToGroup = async (groupId: string, name: string): Promise<void> => {
    try {
        const existingGroups = await getGroupsFromStorage();

        const groupIndex = existingGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) {
            throw new Error("Group not found");
        }

        const newMember: Member = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique virtual ID
            name,
            isVirtual: true
        };

        existingGroups[groupIndex].members.push(newMember);
        await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(existingGroups));
    } catch (error: any) {
        throw new Error(error.message);
    }
};
