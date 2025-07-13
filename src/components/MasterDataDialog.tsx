
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from './SearchableSelect';

interface MasterDataDialogProps {
  type: 'mandir' | 'kshetra' | 'village';
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterDataDialog = ({ type, open, onClose, onSuccess }: MasterDataDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mandirs, setMandirs] = useState<Array<{ id: string; name: string }>>([]);
  const [kshetras, setKshetras] = useState<Array<{ id: string; name: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    contact_person: '',
    contact_number: '',
    email: '',
    established_date: '',
    mandir_id: '',
    kshetra_id: '',
    district: '',
    state: '',
    pincode: '',
    population: ''
  });

  useEffect(() => {
    if (open) {
      fetchMandirs();
      if (type === 'village') {
        fetchKshetras();
      }
    }
  }, [open, type]);

  const fetchMandirs = async () => {
    try {
      const { data, error } = await supabase
        .from('mandirs')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setMandirs(data || []);
    } catch (error: any) {
      console.error('Error fetching mandirs:', error);
    }
  };

  const fetchKshetras = async () => {
    try {
      const { data, error } = await supabase
        .from('kshetras')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setKshetras(data || []);
    } catch (error: any) {
      console.error('Error fetching kshetras:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data: any = {
        name: formData.name,
        description: formData.description,
        contact_person: formData.contact_person,
        contact_number: formData.contact_number,
      };

      if (type === 'mandir') {
        data = {
          ...data,
          address: formData.address,
          email: formData.email,
          established_date: formData.established_date || null,
        };
      } else if (type === 'kshetra') {
        data = {
          ...data,
          mandir_id: formData.mandir_id,
        };
      } else if (type === 'village') {
        data = {
          ...data,
          kshetra_id: formData.kshetra_id,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
          population: formData.population ? parseInt(formData.population) : null,
        };
      }

      const { error } = await supabase
        .from(`${type}s`)
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
      });

      setFormData({
        name: '',
        description: '',
        address: '',
        contact_person: '',
        contact_number: '',
        email: '',
        established_date: '',
        mandir_id: '',
        kshetra_id: '',
        district: '',
        state: '',
        pincode: '',
        population: ''
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'mandir': return 'Add New Mandir';
      case 'kshetra': return 'Add New Kshetra';
      case 'village': return 'Add New Village';
      default: return 'Add New Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new {type}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {type === 'kshetra' && (
            <div>
              <Label>Mandir *</Label>
              <SearchableSelect
                options={mandirs.map(m => ({ value: m.id, label: m.name }))}
                value={formData.mandir_id}
                onValueChange={(value) => setFormData({ ...formData, mandir_id: value })}
                placeholder="Select Mandir"
              />
            </div>
          )}

          {type === 'village' && (
            <div>
              <Label>Kshetra *</Label>
              <SearchableSelect
                options={kshetras.map(k => ({ value: k.id, label: k.name }))}
                value={formData.kshetra_id}
                onValueChange={(value) => setFormData({ ...formData, kshetra_id: value })}
                placeholder="Select Kshetra"
              />
            </div>
          )}

          {type === 'mandir' && (
            <>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="established_date">Established Date</Label>
                <Input
                  id="established_date"
                  type="date"
                  value={formData.established_date}
                  onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                />
              </div>
            </>
          )}

          {type === 'village' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="population">Population</Label>
                  <Input
                    id="population"
                    type="number"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
