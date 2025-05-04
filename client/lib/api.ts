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
  ingredients: string[];
  instructions: string[];
  userRating: number;
  userNotes: string[];
  isMasterRecipe: boolean;
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

// --- Auth --------------------------------------------------

export async function register(
  email: string,
  password: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Username: email, Password: password, Utensils: [] }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return { status: "ok" };
}

export async function login(
  email: string,
  password: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Username: email, Password: password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg =
      (Array.isArray(errorData.detail) && errorData.detail.map((e: any) => e.msg).join(", ")) ||
      errorData.detail ||
      "Login failed";
    throw new Error(msg);
  }
  localStorage.setItem(USER_KEY, email);
  return { status: "ok" };
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
  const res = await fetch(`${API_URL}/users/${encodeURIComponent(user)}/equipment`);
  if (!res.ok) throw new Error("Failed to fetch equipment");
  return res.json();
}

export async function saveEquipment(equipment: string[]): Promise<{ status: string }> {
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
  const user = getCurrentUser();
  const qs = new URLSearchParams();
  qs.append("username", user);
  equipment.forEach((e) => qs.append("equipment", e));
  const res = await fetch(`${API_URL}/recipies?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch recipes");
  return res.json();
}

export async function fetchMasterRecipes(equipment: string[]): Promise<Recipe[]> {
  try {
    const user = getCurrentUser();
    const params = new URLSearchParams();
    params.append("username", user);
    equipment.forEach(e => params.append("equipment", e));
    console.log('Fetching master recipes with equipment:', equipment);
    
    const response = await fetch(`${API_URL}/master/recipies?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch master recipes:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return [];
    }

    const recipes = await response.json();
    console.log('Received recipes:', recipes);
    
    if (!Array.isArray(recipes)) {
      console.error('Invalid response format from master recipes endpoint:', recipes);
      return [];
    }

    return recipes.map((recipe: any) => ({
      id: recipe.id.toString(),
      title: recipe.title,
      description: recipe.description || '',
      equipment: recipe.equipment || [],
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      userRating: recipe.userRating || 0,
      userNotes: recipe.userNotes || [],
      isMasterRecipe: true
    }));
  } catch (error) {
    console.error('Error fetching master recipes:', error);
    return [];
  }
}

export async function fetchRecipeById(id: string): Promise<RecipeDetail> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipie/${id}?username=${user}`);
  if (!res.ok) throw new Error("Failed to fetch recipe");
  return res.json();
}

export async function createRecipe(
  data: RecipeFormData
): Promise<{ id: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies?username=${user}`, {
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
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies/${id}?username=${user}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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
      throw new Error(
        "Cannot edit master recipes directly. Please create a personal copy first."
      );
    }
    throw new Error("Failed to update recipe");
  }
  return { status: "ok" };
}

export async function deleteRecipe(id: string): Promise<{ status: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies/${id}?username=${user}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("Cannot delete master recipes");
    }
    throw new Error("Failed to delete recipe");
  }
  return { status: "ok" };
}

export async function saveAsMyVersion(
  id: string,
  data: RecipeFormData
): Promise<{ id: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies/${id}/clone?username=${user}`, {
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

// --- Ratings & Notes --------------------------------------

export async function saveRating(
  id: string,
  rating: number
): Promise<{ status: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies/${id}/rating?username=${user}`, {
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
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/recipies/${id}/notes?username=${user}`, {
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
  const user = getCurrentUser();  
  const res = await fetch(
    `${API_URL}/recipies/${id}/notes/${noteIndex}?username=${user}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete note");
  return { status: "ok" };
}

// --- Admin: master recipes -------------------------------

export async function fetchAllRecipes(): Promise<{ recipes: RecipeDetail[] }> {
  const user = getCurrentUser();
  console.log('Fetching all recipes for admin user:', user);
  
  const res = await fetch(`${API_URL}/admin/recipes?username=${user}`, {
    credentials: "include"
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("Admin access required");
    }
    const errorText = await res.text();
    console.error('Error fetching recipes:', errorText);
    throw new Error("Failed to fetch recipes");
  }
  
  const recipes = await res.json();
  console.log('Received recipes:', recipes);
  return { recipes };
}

export async function createMasterRecipe(
  data: RecipeFormData
): Promise<{ id: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/admin/recipes?username=${user}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
      throw new Error("Admin access required");
    }
    throw new Error("Failed to create master recipe");
  }
  return res.json();
}

export async function updateMasterRecipe(
  id: string,
  data: RecipeFormData
): Promise<{ status: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/admin/recipes/${id}?username=${user}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
      throw new Error("Admin access required");
    }
    throw new Error("Failed to update master recipe");
  }
  return { status: "ok" };
}

export async function deleteMasterRecipe(
  id: string
): Promise<{ status: string }> {
  const user = getCurrentUser();
  const res = await fetch(`${API_URL}/admin/recipes/${id}?username=${user}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to delete master recipe");
  }
  return { status: "ok" };
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = getCurrentUser();
    console.log('Checking admin status for user:', user);
    const res = await fetch(`${API_URL}/users/${encodeURIComponent(user)}/role`, {
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    });
    console.log('Admin check response status:', res.status);
    if (!res.ok) {
      console.log('Admin check failed:', res.status);
      return false;
    }
    const data = await res.json();
    console.log('Admin check response:', data);
    return data.role === 'admin';
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

