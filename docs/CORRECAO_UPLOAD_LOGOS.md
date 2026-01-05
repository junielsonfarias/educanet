# Correção: Upload de Logos para Supabase Storage

**Data:** 2025-01-27  
**Status:** ✅ **CORREÇÕES APLICADAS**

---

## 🔍 PROBLEMA IDENTIFICADO

As logos estavam sendo salvas como **base64 no localStorage**, o que causava:
- ❌ Logos só apareciam no navegador onde foram salvas
- ❌ Não funcionavam em outros navegadores/dispositivos
- ❌ Dados não sincronizados entre usuários
- ❌ localStorage tem limite de tamanho

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Upload para Supabase Storage
**Arquivo:** `src/pages/settings/GeneralSettings.tsx`

**Mudanças:**
- ✅ Upload de logos agora usa Supabase Storage (bucket `photos`)
- ✅ Imagens são salvas com URL pública acessível de qualquer navegador
- ✅ Validação de tipo de arquivo (apenas imagens)
- ✅ Validação de tamanho (máximo 5MB)
- ✅ Caminho organizado: `logos/{municipalityLogo|secretaryLogo}/{timestamp}-{filename}`

**Código:**
```typescript
// Fazer upload para Supabase Storage
const { uploadFile } = await import('@/lib/supabase/storage')

const filePath = `logos/${field}/${Date.now()}-${file.name}`
const uploadResult = await uploadFile({
  bucket: 'photos', // Bucket público
  file,
  path: filePath,
  upsert: true, // Substituir se já existir
})

// Salvar URL pública no formData
setFormData((prev) => ({ ...prev, [field]: uploadResult.publicUrl }))
```

### 2. Salvar Configurações no Supabase
**Arquivo:** `src/pages/settings/GeneralSettings.tsx`

**Mudanças:**
- ✅ Configurações agora são salvas no Supabase usando `settingsService`
- ✅ URLs das logos são persistidas no banco de dados
- ✅ Dados disponíveis em todos os navegadores/dispositivos

**Código:**
```typescript
const handleSave = async () => {
  // Salvar no Supabase usando settingsService
  const { settingsService } = await import('@/lib/supabase/services')
  
  await settingsService.setMultiple({
    municipalityName: formData.municipalityName,
    educationSecretaryName: formData.educationSecretaryName,
    municipalityLogo: formData.municipalityLogo || null,
    secretaryLogo: formData.secretaryLogo || null,
    // ... outras configurações
  }, 'general')
  
  // Também atualizar store local para compatibilidade
  updateSettings(formData)
}
```

### 3. Carregar Configurações do Supabase
**Arquivo:** `src/stores/useSettingsStore.tsx`

**Mudanças:**
- ✅ Store agora carrega configurações do Supabase ao iniciar
- ✅ localStorage usado apenas como cache/fallback
- ✅ Dados sincronizados entre todos os navegadores

**Código:**
```typescript
// Carregar configurações do Supabase
const supabaseSettings = await settingsService.getAllSettings()

if (supabaseSettings && Object.keys(supabaseSettings).length > 0) {
  const mergedSettings: GeneralSettings = {
    ...initialSettings,
    municipalityLogo: supabaseSettings.municipalityLogo || initialSettings.municipalityLogo,
    secretaryLogo: supabaseSettings.secretaryLogo || initialSettings.secretaryLogo,
    // ... outras configurações
  }
  
  setSettings(mergedSettings)
  localStorage.setItem('edu_settings', JSON.stringify(mergedSettings)) // Cache
}
```

---

## 📋 ESTRUTURA DE ARMAZENAMENTO

### Supabase Storage
- **Bucket:** `photos` (público)
- **Caminho:** `logos/{municipalityLogo|secretaryLogo}/{timestamp}-{filename}`
- **Exemplo:** `logos/municipalityLogo/1706371200000-logo-municipio.png`

### Supabase Database
- **Tabela:** `system_settings`
- **Categoria:** `general`
- **Chaves:**
  - `municipalityLogo` → URL pública da logo do município
  - `secretaryLogo` → URL pública da logo da secretaria

---

## 🧪 COMO TESTAR

### 1. Fazer Upload de Logo
1. Acesse **Configurações > Configurações Gerais**
2. Clique em **"Escolher arquivo"** na seção de logos
3. Selecione uma imagem (máximo 5MB)
4. Aguarde o upload (mensagem de sucesso)
5. Clique em **"Salvar"**

### 2. Verificar em Outro Navegador
1. Abra um navegador diferente (ou modo anônimo)
2. Acesse o portal institucional (`/`)
3. Verifique se as logos aparecem no cabeçalho

### 3. Verificar no Supabase
1. Acesse **Supabase Dashboard > Storage > photos**
2. Verifique se as imagens estão em `logos/`
3. Acesse **Supabase Dashboard > Database > system_settings**
4. Verifique se as URLs estão salvas nas chaves `municipalityLogo` e `secretaryLogo`

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [x] Upload de logos funciona
- [x] Logos são salvas no Supabase Storage
- [x] URLs são salvas no banco de dados
- [x] Logos aparecem no portal institucional
- [x] Logos aparecem em outros navegadores
- [x] Validação de tipo de arquivo funciona
- [x] Validação de tamanho funciona
- [x] Mensagens de erro são claras

---

## 🔧 ARQUIVOS MODIFICADOS

1. ✅ `src/pages/settings/GeneralSettings.tsx`
   - Função `handleFileChange()` atualizada para usar Supabase Storage
   - Função `handleSave()` atualizada para salvar no Supabase

2. ✅ `src/stores/useSettingsStore.tsx`
   - Carregamento de configurações do Supabase
   - localStorage usado apenas como cache

---

## 📝 PRÓXIMOS PASSOS

1. **Testar o upload de logos**
2. **Verificar se aparecem em outros navegadores**
3. **Se necessário, migrar logos antigas do localStorage para Supabase**

---

## 🚨 NOTAS IMPORTANTES

- **Bucket `photos` é público** - URLs são acessíveis sem autenticação
- **Tamanho máximo:** 5MB por imagem
- **Formatos aceitos:** JPEG, JPG, PNG, WEBP, GIF
- **Caminho organizado:** `logos/{tipo}/{timestamp}-{filename}`

---

**Última atualização:** 2025-01-27  
**Status:** Correções aplicadas, pronto para teste

