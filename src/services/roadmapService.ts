import { supabase, RoadmapRow, RoadmapInsert, RoadmapUpdate } from '../lib/supabase';

export class RoadmapService {
  // Create a new roadmap
  static async createRoadmap(
    title: string,
    category: string,
    phases: any[],
    roadmapNodes: any[]
  ): Promise<{ data: RoadmapRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const roadmapData: RoadmapInsert = {
        user_id: user.id,
        title,
        category,
        phases,
        roadmap_nodes: roadmapNodes,
      };

      const { data, error } = await supabase
        .from('roadmaps')
        .insert(roadmapData)
        .select()
        .single();

      if (error) {
        console.error('Error creating roadmap:', error);
      } else {
        console.log('Roadmap created successfully:', data?.id);
      }

      return { data, error };
    } catch (error) {
      console.error('Error creating roadmap:', error);
      return { data: null, error };
    }
  }

  // Get all roadmaps for the current user
  static async getUserRoadmaps(): Promise<{ data: RoadmapRow[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return { data: null, error: { message: 'User not authenticated' } };
      }

      console.log('Fetching roadmaps for user:', user.id);

      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching roadmaps:', error);
      } else {
        console.log('Fetched roadmaps:', data?.length);
      }

      return { data, error };
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      return { data: null, error };
    }
  }

  // Get a specific roadmap by ID
  static async getRoadmapById(id: string): Promise<{ data: RoadmapRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      return { data: null, error };
    }
  }

  // Update a roadmap
  static async updateRoadmap(
    id: string,
    updates: Partial<RoadmapUpdate>
  ): Promise<{ data: RoadmapRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from('roadmaps')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating roadmap:', error);
      return { data: null, error };
    }
  }

  // Delete a roadmap
  static async deleteRoadmap(id: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: { message: 'User not authenticated' } };
      }

      const { error } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      return { error };
    }
  }
}