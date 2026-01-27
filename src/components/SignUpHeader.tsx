type Props = {
  title: string;
  description?: string;
};

export default function SignUpHeader({ title, description }: Props) {
  return (
    <header className="space-y-1">
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      {description ? <p className="text-sm text-gray-600">{description}</p> : null}
    </header>
  );
}
