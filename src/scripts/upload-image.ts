
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing in .env file.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function uploadImage() {
  const imagePath = path.resolve(__dirname, '../../public/dashboard-preview.png');
  const fileName = `dashboard-preview-${Date.now()}.png`;
  const bucketName = 'images';

  try {
    // 1. Ler o arquivo da imagem
    const imageBuffer = await fs.readFile(imagePath);
    console.log('Imagem lida com sucesso.');

    // 2. Fazer o upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png',
      });

    if (error) {
      throw error;
    }

    console.log('Upload realizado com sucesso:', data);

    // 3. Obter a URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      throw new Error('Não foi possível obter a URL pública.');
    }

    console.log('\n✅ Imagem enviada com sucesso!');
    console.log('\n🔗 URL Pública:');
    console.log(publicUrlData.publicUrl);
    console.log('\nCopie a URL acima e cole no arquivo src/pages/Index.tsx na propriedade `src` da tag `img`.\n');

  } catch (error) {
    console.error('\n❌ Erro durante o upload:');
    console.error(error);
  }
}

uploadImage();
