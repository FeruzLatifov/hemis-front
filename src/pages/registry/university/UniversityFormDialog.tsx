import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { universitiesApi, UniversityRow, Dictionary } from '@/api/universities.api';
import { toast } from 'sonner';
import { extractApiErrorMessage } from '@/utils/error.util';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, MapPin, Globe, Settings, Info, Save } from 'lucide-react';

// Zod validation schema
const universitySchema = z.object({
  code: z.string().min(1, 'Kod majburiy').trim(),
  name: z.string().min(1, 'Nom majburiy').trim(),
  tin: z.string().optional(),
  ownershipCode: z.string().min(1, 'Mulkchilik turi majburiy'),
  universityTypeCode: z.string().min(1, 'OTM turi majburiy'),
  regionCode: z.string().optional(),
  address: z.string().optional(),
  cadastre: z.string().optional(),
  universityUrl: z.string().url('Noto\'g\'ri URL').optional().or(z.literal('')),
  studentUrl: z.string().url('Noto\'g\'ri URL').optional().or(z.literal('')),
  teacherUrl: z.string().url('Noto\'g\'ri URL').optional().or(z.literal('')),
  uzbmbUrl: z.string().url('Noto\'g\'ri URL').optional().or(z.literal('')),
  mailAddress: z.string().optional(),
  bankInfo: z.string().optional(),
  accreditationInfo: z.string().optional(),
  active: z.boolean(),
  gpaEdit: z.boolean(),
  accreditationEdit: z.boolean(),
  addStudent: z.boolean(),
  allowGrouping: z.boolean(),
  allowTransferOutside: z.boolean(),
});

type UniversityFormData = z.infer<typeof universitySchema>;


interface UniversityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university?: UniversityRow | null;
  onSuccess: () => void;
}

export default function UniversityFormDialog({
  open,
  onOpenChange,
  university,
  onSuccess,
}: UniversityFormDialogProps) {
  const [dictionaries, setDictionaries] = useState<{
    regions: Dictionary[];
    ownerships: Dictionary[];
    types: Dictionary[];
  }>({ regions: [], ownerships: [], types: [] });

  const isEdit = !!university;

  // React Hook Form with Zod validation
  const form = useForm<UniversityFormData>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      code: '',
      name: '',
      tin: '',
      ownershipCode: '',
      universityTypeCode: '',
      regionCode: '',
      address: '',
      cadastre: '',
      universityUrl: '',
      studentUrl: '',
      teacherUrl: '',
      uzbmbUrl: '',
      mailAddress: '',
      bankInfo: '',
      accreditationInfo: '',
      active: true,
      gpaEdit: false,
      accreditationEdit: true,
      addStudent: false,
      allowGrouping: false,
      allowTransferOutside: true,
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;

  // Load dictionaries
  useEffect(() => {
    const loadDictionaries = async () => {
      try {
        const data = await universitiesApi.getDictionaries();
        setDictionaries(data);
      } catch (error) {
        // ⭐ Backend-driven i18n: Use backend's localized message
        toast.error(extractApiErrorMessage(error, 'Lug\'atlar yuklanmadi'));
      }
    };
    if (open) {
      loadDictionaries();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (university && open) {
      reset({
        code: university.code,
        name: university.name,
        tin: university.tin || '',
        ownershipCode: university.ownershipCode || '',
        universityTypeCode: university.universityTypeCode || '',
        regionCode: university.regionCode || university.soatoRegion || '',
        address: university.address || '',
        cadastre: university.cadastre || '',
        universityUrl: university.universityUrl || '',
        studentUrl: university.studentUrl || '',
        teacherUrl: university.teacherUrl || '',
        uzbmbUrl: university.uzbmbUrl || '',
        mailAddress: university.mailAddress || '',
        bankInfo: university.bankInfo || '',
        accreditationInfo: university.accreditationInfo || '',
        active: university.active ?? true,
        gpaEdit: university.gpaEdit ?? false,
        accreditationEdit: university.accreditationEdit ?? true,
        addStudent: university.addStudent ?? false,
        allowGrouping: university.allowGrouping ?? false,
        allowTransferOutside: university.allowTransferOutside ?? true,
      });
    } else if (!university && open) {
      reset({
        code: '',
        name: '',
        tin: '',
        ownershipCode: '',
        universityTypeCode: '',
        regionCode: '',
        address: '',
        cadastre: '',
        universityUrl: '',
        studentUrl: '',
        teacherUrl: '',
        uzbmbUrl: '',
        mailAddress: '',
        bankInfo: '',
        accreditationInfo: '',
        active: true,
        gpaEdit: false,
        accreditationEdit: true,
        addStudent: false,
        allowGrouping: false,
        allowTransferOutside: true,
      });
    }
  }, [university, open, reset]);

  const onSubmit = async (data: UniversityFormData) => {
    try {
      if (isEdit) {
        await universitiesApi.updateUniversity(university.code, data);
        toast.success('OTM muvaffaqiyatli yangilandi');
      } else {
        await universitiesApi.createUniversity(data);
        toast.success('OTM muvaffaqiyatli yaratildi');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(error, isEdit ? 'OTM yangilanmadi' : 'OTM yaratilmadi'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isEdit ? 'OTM tahrirlash' : 'Yangi OTM qo\'shish'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {isEdit ? 'Ma\'lumotlarni yangilang' : 'Yangi universitet ma\'lumotlarini kiriting'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="basic" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 grid grid-cols-5 gap-1">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Asosiy
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Manzil
              </TabsTrigger>
              <TabsTrigger value="urls" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Havolalar
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sozlamalar
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Qo'shimcha
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Kod <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      {...form.register('code')}
                      disabled={isEdit}
                      placeholder="00001"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-500">{errors.code.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tin">INN</Label>
                    <Input
                      id="tin"
                      {...form.register('tin')}
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nomi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="OTM to'liq nomi"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Mulkchilik turi <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('ownershipCode')}
                      onValueChange={(value) => setValue('ownershipCode', value)}
                    >
                      <SelectTrigger className={errors.ownershipCode ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {dictionaries.ownerships.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ownershipCode && (
                      <p className="text-sm text-red-500">{errors.ownershipCode.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      OTM turi <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('universityTypeCode')}
                      onValueChange={(value) => setValue('universityTypeCode', value)}
                    >
                      <SelectTrigger className={errors.universityTypeCode ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {dictionaries.types.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.universityTypeCode && (
                      <p className="text-sm text-red-500">{errors.universityTypeCode.message}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Hudud</Label>
                  <Select
                    value={watch('regionCode')}
                    onValueChange={(value) => setValue('regionCode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {dictionaries.regions.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Manzil</Label>
                  <Textarea
                    id="address"
                    {...form.register('address')}
                    placeholder="To'liq manzil"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mailAddress">Pochta manzili</Label>
                  <Textarea
                    id="mailAddress"
                    {...form.register('mailAddress')}
                    placeholder="Pochta manzili"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadastre">Kadastr raqami</Label>
                  <Input
                    id="cadastre"
                    {...form.register('cadastre')}
                    placeholder="Kadastr raqami"
                  />
                </div>
              </TabsContent>

              {/* URLs Tab */}
              <TabsContent value="urls" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="universityUrl">Rasmiy veb-sayt</Label>
                  <Input
                    id="universityUrl"
                    {...form.register('universityUrl')}
                    type="url"
                    placeholder="https://university.uz"
                    className={errors.universityUrl ? 'border-red-500' : ''}
                  />
                  {errors.universityUrl && (
                    <p className="text-sm text-red-500">{errors.universityUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentUrl">Talabalar portali</Label>
                  <Input
                    id="studentUrl"
                    {...form.register('studentUrl')}
                    type="url"
                    placeholder="https://student.university.uz"
                    className={errors.studentUrl ? 'border-red-500' : ''}
                  />
                  {errors.studentUrl && (
                    <p className="text-sm text-red-500">{errors.studentUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacherUrl">O'qituvchilar portali</Label>
                  <Input
                    id="teacherUrl"
                    {...form.register('teacherUrl')}
                    type="url"
                    placeholder="https://teacher.university.uz"
                    className={errors.teacherUrl ? 'border-red-500' : ''}
                  />
                  {errors.teacherUrl && (
                    <p className="text-sm text-red-500">{errors.teacherUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uzbmbUrl">UZBMB URL</Label>
                  <Input
                    id="uzbmbUrl"
                    {...form.register('uzbmbUrl')}
                    type="url"
                    placeholder="https://uzbmb.university.uz"
                    className={errors.uzbmbUrl ? 'border-red-500' : ''}
                  />
                  {errors.uzbmbUrl && (
                    <p className="text-sm text-red-500">{errors.uzbmbUrl.message}</p>
                  )}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-3 mt-0">
                {[
                  { key: 'active' as const, label: 'Faol' },
                  { key: 'gpaEdit' as const, label: 'GPA tahrirlash' },
                  { key: 'accreditationEdit' as const, label: 'Akkreditatsiya tahrirlash' },
                  { key: 'addStudent' as const, label: 'Talaba qo\'shish' },
                  { key: 'allowGrouping' as const, label: 'Guruhlash ruxsati' },
                  { key: 'allowTransferOutside' as const, label: 'Tashqi o\'tkazmalarga ruxsat' },
                ].map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Checkbox
                      id={setting.key}
                      checked={watch(setting.key)}
                      onCheckedChange={(checked) => setValue(setting.key, !!checked)}
                    />
                    <Label
                      htmlFor={setting.key}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {setting.label}
                    </Label>
                  </div>
                ))}
              </TabsContent>

              {/* Additional Tab */}
              <TabsContent value="additional" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="bankInfo">Bank ma'lumotlari</Label>
                  <Textarea
                    id="bankInfo"
                    {...form.register('bankInfo')}
                    placeholder="Bank rekvizitlari"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accreditationInfo">Akkreditatsiya ma'lumotlari</Label>
                  <Textarea
                    id="accreditationInfo"
                    {...form.register('accreditationInfo')}
                    placeholder="Akkreditatsiya haqida ma'lumot"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEdit ? 'Saqlash' : 'Yaratish'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}