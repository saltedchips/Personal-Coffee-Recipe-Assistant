// client/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const USER_KEY = "currentUser";

export interface EquipmentPayload {
  equipment: string[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  equipment: string[];
}

export interface RecipeDetail extends Recipe {
  ingredients: string[];
  instructions: string[];
  userRating: number;
  userNotes: string[];
  isMasterRecipe: boolean;
}

export interface RecipeFormData {
  title: string;
  description: string;
  equipment: string[];
  ingredients: string[];
  instructions: string[];
}

interface UserData {
  email: string;
  username: string;
}

// --- Auth --------------------------------------------------

export async function register(
  email: string,
  password: string
): Promise<{ status: string }> {
  try {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        Username: email,
        Password: password,
        Utensils: []
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration failed");
  }
  return { status: "ok" };
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error("Failed to connect to the server. Please try again later.");
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ status: string }> {
  try {
    console.log('Attempting login with:', { email });
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        Username: email,
        Password: password 
      }),
  });
    
    console.log('Login response status:', res.status);
    console.log('Login response status text:', res.statusText);
    
    if (!res.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await res.json();
        console.log('Error response data:', errorData);
  
        // Handle validation errors (422)
        if (res.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => {
            if (typeof err === 'object' && err.msg) {
              return err.msg;
            }
            return String(err);
          }).join(', ');
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData);
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
        errorMessage = res.statusText || errorMessage;
      }
      console.log('Throwing error with message:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Get the response data
  const data = await res.json();
    console.log('Login response data:', data);
  
    // Store user info
  localStorage.setItem(USER_KEY, email);
  
  // Check if user is admin by trying to access admin endpoint
  try {
      const adminRes = await fetch(`${API_URL}/admin/recipes?username=${email}`);
    // Only set isAdmin to true if we get a 200 OK response
    const isAdmin = adminRes.status === 200;
    localStorage.setItem('isAdmin', isAdmin.toString());
    console.log('Login - Admin check result:', isAdmin);
  } catch (err) {
    console.error('Login - Error checking admin status:', err);
    localStorage.setItem('isAdmin', 'false');
  }
  
  return { status: "ok" };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect to the server. Please try again later.");
  }
}

function getCurrentUser(): string {
  const user = localStorage.getItem(USER_KEY);
  if (!user) throw new Error("No user logged in");
  return user;
}

// --- Equipment --------------------------------------------

export async function fetchAllEquipment(): Promise<EquipmentPayload> {
  const res = await fetch(`${API_URL}/equipment`);
  if (!res.ok) throw new Error("Failed to fetch equipment options");
  return res.json();
}

export async function fetchEquipment(): Promise<EquipmentPayload> {
  const user = getCurrentUser();
  const res = await fetch(
    `${API_URL}/users/${encodeURIComponent(user)}/equipment`
  );
  if (!res.ok) throw new Error("Failed to fetch equipment");
  return res.json();
}

export async function saveEquipment(
  equipment: string[]
): Promise<{ status: string }> {
  const user = getCurrentUser();
  const res = await fetch(
    `${API_URL}/users/${encodeURIComponent(user)}/equipment`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Utensils: equipment }),
    }
  );
  if (!res.ok) throw new Error("Failed to save equipment");
  return { status: "ok" };
}

// --- Recipes ----------------------------------------------

export async function fetchRecipes(
  equipment: string[]
): Promise<{ recipes: Recipe[] }> {
  const qs = new URLSearchParams();
  equipment.forEach((e) => qs.append("equipment", e));
  const res = await fetch(`${API_URL}/recipies?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

export async function fetchRecipeById(
  id: string
): Promise<RecipeDetail> {
  const res = await fetch(`${API_URL}/recipie/${id}`);
  if (!res.ok) throw new Error("Failed to fetch recipe");
  return res.json();
}

export async function createRecipe(
  data: RecipeFormData
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/recipies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Title: data.title,
      Description: data.description,
      Utensils: data.equipment.map((u) => ({ Utensil: u })),
      Recipie: data.instructions.join("\n"),
      Ingredients: data.ingredients,
    }),
  });
  if (!res.ok) throw new Error("Failed to create recipe");
  return res.json();
}

export async function updateRecipe(
  id: string,
  data: RecipeFormData
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/recipies/${id}?username=${getCurrentUser()}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      Title: data.title,
      Description: data.description,
      Utensils: data.equipment.map((u) => ({ Utensil: u })),
      Recipie: data.instructions.join("\n"),
      Ingredients: data.ingredients,
    }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Cannot edit master recipes directly. Please create a personal copy first.');
    }
    throw new Error("Failed to update recipe");
  }
  return { status: "ok" };
}

// --- Ratings & Notes --------------------------------------

export async function saveRating(
  id: string,
  rating: number
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/recipies/${id}/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new Error("Failed to save rating");
  return { status: "ok" };
}

export async function addNote(
  id: string,
  note: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/recipies/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Failed to add note");
  return { status: "ok" };
}

export async function deleteNote(
  id: string,
  noteIndex: number
): Promise<{ status: string }> {
  const res = await fetch(
    `${API_URL}/recipies/${id}/notes/${noteIndex}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete note");
  return { status: "ok" };
}

export async function saveAsMyVersion(
  id: string,
  data: RecipeFormData
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/recipies/${id}/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Title: data.title,
      Description: data.description,
      Utensils: data.equipment.map((u) => ({ Utensil: u })),
      Recipie: data.instructions.join("\n"),
      Ingredients: data.ingredients,
    }),
  });
  if (!res.ok) throw new Error("Failed to save as my version");
  return res.json();
}

// --- Admin: master recipes -------------------------------

export async function fetchAllRecipes(): Promise<{
  recipes: RecipeDetail[];
}> {
  const res = await fetch(`${API_URL}/admin/recipes?username=${getCurrentUser()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error("Failed to fetch master recipes");
  }
  return res.json();
}

export async function createMasterRecipe(
  data: RecipeFormData
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/admin/recipes?username=${getCurrentUser()}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      Title: data.title,
      Description: data.description,
      Utensils: data.equipment.map((u) => ({ Utensil: u })),
      Recipie: data.instructions.join("\n"),
      Ingredients: data.ingredients,
    }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error("Failed to create master recipe");
  }
  return res.json();
}

export async function updateMasterRecipe(
  id: string,
  data: RecipeFormData
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/admin/recipes/${id}?username=${getCurrentUser()}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      Title: data.title,
      Description: data.description,
      Utensils: data.equipment.map((u) => ({ Utensil: u })),
      Recipie: data.instructions.join("\n"),
      Ingredients: data.ingredients,
    }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error("Failed to update master recipe");
  }
  return { status: "ok" };
}

export async function deleteMasterRecipe(
  id: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/admin/recipes/${id}?username=${getCurrentUser()}`, {
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error("Failed to delete master recipe");
  }
  return { status: "ok" };
}

// Admin API functions
export const adminListRecipes = async (): Promise<Recipe[]> => {
  const response = await fetch(`${API_URL}/admin/recipes?username=${getCurrentUser()}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error('Failed to fetch recipes');
  }
  const data = await response.json();
  return data.recipes;
};

export const adminCreateRecipe = async (recipe: RecipeFormData): Promise<number> => {
  const response = await fetch(`${API_URL}/admin/recipes?username=${getCurrentUser()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(recipe)
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error('Failed to create recipe');
  }
  const data = await response.json();
  return data.id;
};

export const adminUpdateRecipe = async (id: number, recipe: RecipeFormData): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/recipes/${id}?username=${getCurrentUser()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(recipe)
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error('Failed to update recipe');
  }
};

export const adminDeleteRecipe = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/recipes/${id}?username=${getCurrentUser()}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required');
    }
    throw new Error('Failed to delete recipe');
  }
};

export async function isAdmin(): Promise<boolean> {
  const isAdmin = localStorage.getItem('isAdmin');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem(USER_KEY);
  
  if (!token || !user) {
    console.log('isAdmin check - No token or user found');
    return false;
  }
  
  // Double check admin status with the server
  try {
    const res = await fetch(`${API_URL}/admin/recipes?username=${user}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const isAdmin = res.status === 200;
    localStorage.setItem('isAdmin', isAdmin.toString());
    console.log('isAdmin check - Server response:', isAdmin);
    return isAdmin;
  } catch (err) {
    console.error('isAdmin check - Error:', err);
    return false;
  }
}

export async function updateUsername(username: string): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/users/username`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ Username: username }),
  });
  if (!res.ok) throw new Error("Failed to update username");
  return res.json();
}

export async function deleteRecipe(
  id: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/recipies/${id}?username=${getCurrentUser()}`, {
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Cannot delete master recipes');
    }
    throw new Error("Failed to delete recipe");
  }
  return { status: "ok" };
}
