import { useRef } from "react";
import Button from "./Button";

type Props = {
  uri: string | null;
  onPick: (dataUrl: string) => void;
};

export default function ImageUploadBox({ uri, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (result) onPick(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
          {uri ? <img src={uri} alt="프로필 미리보기" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">프로필 이미지를 선택해주세요.</p>
          <p className="text-xs text-gray-500">JPG/PNG 권장</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        이미지 선택
      </Button>
    </div>
  );
}
