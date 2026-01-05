/**
 * PersonService - Serviço para gerenciamento de pessoas
 * 
 * Gerencia pessoas (alunos, professores, funcionários) na tabela people.
 */

import { BaseService } from './base-service';
import { supabase } from '../client';
import { handleSupabaseError } from '../helpers';

export interface PersonData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  cpf?: string;
  rg?: string;
  email?: string;
  phone?: string;
  address?: string;
  type: 'Aluno' | 'Professor' | 'Funcionario';
  created_by: number;
}

class PersonService extends BaseService<any> {
  constructor() {
    super('people');
  }

  /**
   * Criar uma nova pessoa
   */
  async create(data: PersonData): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from('people')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          cpf: data.cpf || null,
          rg: data.rg || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          type: data.type,
          created_by: data.created_by,
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return result;
    } catch (error) {
      console.error('Error in PersonService.create:', error);
      throw error;
    }
  }

  /**
   * Buscar pessoa por CPF
   */
  async getByCpf(cpf: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('cpf', cpf)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error in PersonService.getByCpf:', error);
      throw error;
    }
  }

  /**
   * Buscar pessoa por ID
   */
  async getById(id: number): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      console.error('Error in PersonService.getById:', error);
      throw error;
    }
  }

  /**
   * Atualizar pessoa
   */
  async update(id: number, data: Partial<PersonData>): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from('people')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          cpf: data.cpf,
          rg: data.rg,
          email: data.email,
          phone: data.phone,
          address: data.address,
          type: data.type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return result;
    } catch (error) {
      console.error('Error in PersonService.update:', error);
      throw error;
    }
  }
}

export const personService = new PersonService();
export default personService;

