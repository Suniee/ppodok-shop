"use client"

import { useState } from "react"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-8" style={{ border: "1px solid var(--toss-border)" }}>
      <h2
        className="text-lg font-bold mb-6 pb-4"
        style={{ color: "var(--toss-text-primary)", borderBottom: "1px solid var(--toss-border)", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DsInputSection() {
  const [val, setVal] = useState("")

  return (
    <Section title="🔤 Input">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Input label="기본 입력" placeholder="텍스트를 입력하세요" />
        <Input label="아이콘 포함" placeholder="검색어를 입력하세요" leftIcon={<Search className="size-4" />} />
        <Input label="비밀번호" type="password" placeholder="비밀번호를 입력하세요" />
        <Input label="힌트 메시지" placeholder="이메일 주소" hint="가입 시 사용한 이메일을 입력하세요" />
        <Input
          label="에러 상태"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="아이디를 입력하세요"
          error={val.length > 0 && val.length < 4 ? "아이디는 4자 이상이어야 합니다" : undefined}
          leftIcon={<User className="size-4" />}
        />
        <Input label="비활성화" placeholder="수정할 수 없어요" disabled />
      </div>
    </Section>
  )
}
