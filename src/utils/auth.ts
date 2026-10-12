import { User, UserRole } from '../types/auth';

const STORAGE_USERS_KEY = 'atm_system_registered_users';
const STORAGE_SESSION_KEY = 'atm_system_current_session';

// Pre-seeded professional enterprise accounts
const INITIAL_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'usr_001',
    name: 'director3378@bank.com',
    email: 'director3378@bank.com',
    role: 'Cash Operations Director',
    department: 'Central Cash Management Unit (CCMU)',
    badgeId: 'CCMU-9901',
    createdAt: '2026-01-15T08:00:00Z',
    avatarColor: 'bg-blue-600',
    passwordHash: 'admin123',
  },
  {
    id: 'usr_002',
    name: 'operations@bank.com',
    email: 'operations@bank.com',
    role: 'Cash Operations Director',
    department: 'ATM Operations & Replenishment',
    badgeId: 'OPS-4412',
    createdAt: '2026-02-01T09:00:00Z',
    avatarColor: 'bg-emerald-600',
    passwordHash: 'CashOps2026!',
  },
  {
    id: 'usr_003',
    name: 'cit.logistics@bank.com',
    email: 'cit.logistics@bank.com',
    role: 'Head of CIT Logistics',
    department: 'Armored Fleet & Security Transport',
    badgeId: 'CIT-7734',
    createdAt: '2026-02-10T10:30:00Z',
    avatarColor: 'bg-amber-600',
    passwordHash: 'CitRoute2026!',
  },
  {
    id: 'usr_004',
    name: 'treasury@bank.com',
    email: 'treasury@bank.com',
    role: 'Treasury Liquidity Analyst',
    department: 'Asset Liability Management (ALM)',
    badgeId: 'ALM-1192',
    createdAt: '2026-02-14T11:00:00Z',
    avatarColor: 'bg-purple-600',
    passwordHash: 'Treasury2026!',
  },
];

export const getRegisteredUsers = (): (User & { passwordHash: string })[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }

    let needsUpdate = false;

    // Migrate any legacy Director profile
    for (const u of parsed) {
      if (u.id === 'usr_001' || u.email === 'samudrapaul80455@gmail.com') {
        if (u.email !== 'director3378@bank.com') {
          u.email = 'director3378@bank.com';
          needsUpdate = true;
        }
        if (u.name === 'Samudra Paul' || !u.name) {
          u.name = 'director3378@bank.com';
          needsUpdate = true;
        }
      }
    }

    // Ensure default users are merged if missing
    const userEmails = new Set(parsed.map((u: User) => u.email.toLowerCase()));
    for (const initUser of INITIAL_USERS) {
      if (!userEmails.has(initUser.email.toLowerCase())) {
        parsed.push(initUser);
        needsUpdate = true;
      }
    }

    // Clean any legacy profile names so they only keep email
    for (const u of parsed) {
      if (
        u.email === 'operations@bank.com' ||
        u.email === 'cit.logistics@bank.com' ||
        u.email === 'treasury@bank.com' ||
        u.email === 'director3378@bank.com'
      ) {
        if (u.name !== u.email) {
          u.name = u.email;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
};

export const getActiveSessionUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    if (user) {
      let changed = false;
      if (user.id === 'usr_001' || user.email === 'samudrapaul80455@gmail.com') {
        user.email = 'director3378@bank.com';
        user.name = 'director3378@bank.com';
        changed = true;
      }
      if (
        user.email === 'operations@bank.com' ||
        user.email === 'cit.logistics@bank.com' ||
        user.email === 'treasury@bank.com' ||
        user.email === 'director3378@bank.com'
      ) {
        if (user.name !== user.email) {
          user.name = user.email;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      }
    }
    return user;
  } catch {
    return null;
  }
};

export const setActiveSessionUser = (user: User | null): void => {
  if (!user) {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } else {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
  }
};

export const loginUser = (
  identifier: string, // email or badgeId
  password: string
): { success: boolean; user?: User; error?: string } => {
  const users = getRegisteredUsers();
  const trimmedIdent = identifier.trim().toLowerCase();
  const normalizedIdent = trimmedIdent.replace(/\s+/g, '');

  const found = users.find((u) => {
    const userEmail = u.email.toLowerCase();
    const userEmailNorm = userEmail.replace(/\s+/g, '');
    const userBadge = u.badgeId.toLowerCase();
    const userBadgeNorm = userBadge.replace(/\s+/g, '');

    return (
      userEmail === trimmedIdent ||
      userEmailNorm === normalizedIdent ||
      userBadge === trimmedIdent ||
      userBadgeNorm === normalizedIdent ||
      // Also match space variations or legacy email
      (u.email === 'director3378@bank.com' &&
        (trimmedIdent === 'director 3378@bank.com' ||
          trimmedIdent === 'samudrapaul80455@gmail.com'))
    );
  });

  if (!found) {
    return {
      success: false,
      error: 'No account found with this email or terminal badge ID.',
    };
  }

  if (found.passwordHash !== password) {
    return {
      success: false,
      error: 'Incorrect authentication password.',
    };
  }

  const updatedUser: User = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    department: found.department,
    badgeId: found.badgeId,
    createdAt: found.createdAt,
    avatarColor: found.avatarColor,
    lastLogin: new Date().toISOString(),
  };

  setActiveSessionUser(updatedUser);
  return { success: true, user: updatedUser };
};

export const registerUser = (params: {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  badgeId?: string;
  password: string;
}): { success: boolean; user?: User; error?: string } => {
  const users = getRegisteredUsers();
  const trimmedEmail = params.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    return {
      success: false,
      error: 'An account with this corporate email address already exists. Please log in.',
    };
  }

  const colors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-indigo-600',
    'bg-purple-600',
    'bg-teal-600',
    'bg-cyan-600',
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const generatedBadge =
    params.badgeId && params.badgeId.trim()
      ? params.badgeId.trim().toUpperCase()
      : `ATM-${Math.floor(1000 + Math.random() * 9000)}`;

  const generatedDepartment =
    params.department && params.department.trim()
      ? params.department.trim()
      : 'Operations & Cash Management';

  const newUserRecord: User & { passwordHash: string } = {
    id: `usr_${Date.now()}`,
    name: params.name.trim(),
    email: params.email.trim(),
    role: params.role,
    department: generatedDepartment,
    badgeId: generatedBadge,
    createdAt: new Date().toISOString(),
    avatarColor: randomColor,
    lastLogin: new Date().toISOString(),
    passwordHash: params.password,
  };

  users.push(newUserRecord);
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist registered user in localStorage', err);
  }

  const safeUser: User = {
    id: newUserRecord.id,
    name: newUserRecord.name,
    email: newUserRecord.email,
    role: newUserRecord.role,
    department: newUserRecord.department,
    badgeId: newUserRecord.badgeId,
    createdAt: newUserRecord.createdAt,
    avatarColor: newUserRecord.avatarColor,
    lastLogin: newUserRecord.lastLogin,
  };

  setActiveSessionUser(safeUser);
  return { success: true, user: safeUser };
};

export const logoutUser = (): void => {
  setActiveSessionUser(null);
};
